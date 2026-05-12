"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import yaml from "js-yaml";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Braces,
  Minimize2,
  Wrench,
  Trash2,
  AlertTriangle,
  FileJson,
  TreePine,
  GitCompareArrows,
  ArrowRightLeft,
  X,
  ClipboardPaste,
  SortAsc,
  Eraser,
  Layers,
  Expand,
  Upload,
  Lock,
  Unlock,
  Sparkles,
  FileCode,
  Shuffle,
  Download,
  Search,
  Replace,
  Undo2,
  Redo2,
  ChevronsUpDown,
  ChevronsDownUp,
  ShieldCheck,
  Filter,
  Table2,
  Plus,
  Minus,
  MoreHorizontal,
  Pencil,
  ClipboardCopy,
  ClipboardPaste as ClipboardPasteIcon,
  CopyPlus,
  Scissors,
  ArrowDownAZ,
  PlusCircle,
  GripVertical,
  ChevronLeft,
  Columns2,
} from "lucide-react";
import Header from "@/components/Header";
import {
  trackToolSuccess,
  trackToolError,
  trackToolCopy,
} from "@/lib/analytics-events";

const TOOL_SLUG = "json";

// ── Types ────────────────────────────────────────────────────────────────

type Tab = "format" | "tree" | "diff" | "convert" | "generate" | "transform" | "table";
type ConvertTarget = "yaml" | "csv" | "typescript" | "env" | "base64" | "xml" | "toml" | "urlencoded" | "schema" | "htmlform" | "tableview" | "mockdata";

interface FixResult {
  text: string;
  fixes: string[];
}

interface JsonError {
  message: string;
  line: number;
  column: number;
}

interface SchemaValidationError {
  path: string;
  message: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: (string | number)[];
  value: unknown;
  parentIsArray: boolean;
}

type WizardFilterOp = "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "startsWith";

interface WizardState {
  filterField: string;
  filterOp: WizardFilterOp;
  filterValue: string;
  sortField: string;
  sortDir: "asc" | "desc";
  pickFields: string[];
  groupByField: string;
  uniq: boolean;
}

// ── Parse / Fix utilities ────────────────────────────────────────────────

function parseJsonError(input: string): JsonError | null {
  try {
    JSON.parse(input);
    return null;
  } catch (e) {
    const msg = (e as SyntaxError).message;
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      let line = 1;
      let column = 1;
      for (let i = 0; i < pos && i < input.length; i++) {
        if (input[i] === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
      }
      return { message: msg, line, column };
    }
    return { message: msg, line: 1, column: 1 };
  }
}

function fixCommonMistakes(input: string): FixResult {
  const fixes: string[] = [];
  let text = input;

  const singleQuoteBefore = text;
  text = text.replace(
    /(?<=[\[{,:\s])(\s*)'((?:[^'\\]|\\.)*)'(\s*)(?=[,\]}\s:])/g,
    '$1"$2"$3'
  );
  if (text !== singleQuoteBefore) {
    fixes.push("Replaced single quotes with double quotes");
  }

  const unquotedKeysBefore = text;
  text = text.replace(
    /(?<=[\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:\s*)/g,
    '"$1"$2'
  );
  if (text !== unquotedKeysBefore) {
    fixes.push("Added quotes to unquoted keys");
  }

  const trailingBefore = text;
  text = text.replace(/,(\s*[}\]])/g, "$1");
  if (text !== trailingBefore) {
    fixes.push("Removed trailing commas");
  }

  const escapeBefore = text;
  text = text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  if (text !== escapeBefore) {
    fixes.push("Fixed invalid escape sequences");
  }

  return { text, fixes };
}

// ── Transform utilities ──────────────────────────────────────────────────

function sortKeysDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeysDeep((obj as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return obj;
}

function removeNullsDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(removeNullsDeep).filter((v) => v !== null);
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== null) result[k] = removeNullsDeep(v);
    }
    return result;
  }
  return obj;
}

function flattenObject(obj: unknown, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const newKey = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(result, flattenObject(v, newKey));
      } else if (Array.isArray(v)) {
        v.forEach((item, i) => {
          if (typeof item === "object" && item !== null) {
            Object.assign(result, flattenObject(item, `${newKey}[${i}]`));
          } else {
            result[`${newKey}[${i}]`] = item;
          }
        });
      } else {
        result[newKey] = v;
      }
    }
  } else {
    result[prefix || "value"] = obj;
  }
  return result;
}

function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.replace(/\[(\d+)\]/g, ".$1").split(".");
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      if (!(part in current)) {
        current[part] = /^\d+$/.test(nextPart) ? [] : {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function toNdjson(data: unknown): string {
  if (Array.isArray(data)) return data.map((item) => JSON.stringify(item)).join("\n");
  return JSON.stringify(data);
}

function fromNdjson(text: string): unknown[] {
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function jsonToEnv(data: unknown): string {
  const flat = flattenObject(data);
  return Object.entries(flat)
    .map(([k, v]) => {
      const envKey = k.toUpperCase().replace(/[.\[\]]/g, "_").replace(/_+/g, "_");
      const val = typeof v === "string" ? v : JSON.stringify(v);
      return val.includes(" ") || val.includes('"') ? `${envKey}="${val}"` : `${envKey}=${val}`;
    })
    .join("\n");
}

function envToJson(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function jsonToUrlEncoded(data: unknown): string {
  const flat = flattenObject(data);
  return Object.entries(flat)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v ?? ""))}`)
    .join("&");
}

function jsonToXmlExport(obj: unknown, rootTag = "root"): string {
  function toXml(val: unknown, tag: string): string {
    if (val === null || val === undefined) return `<${tag}/>`;
    if (Array.isArray(val)) return val.map((item) => toXml(item, "item")).join("\n");
    if (typeof val === "object") {
      const inner = Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => toXml(v, k))
        .join("\n");
      return `<${tag}>\n${inner.split("\n").map((l) => "  " + l).join("\n")}\n</${tag}>`;
    }
    const escaped = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<${tag}>${escaped}</${tag}>`;
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(obj, rootTag);
}

function jsonToToml(obj: unknown, prefix = ""): string {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return "";
  const lines: string[] = [];
  const tables: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const section = prefix ? `${prefix}.${k}` : k;
      tables.push(`[${section}]`);
      tables.push(jsonToToml(v, section));
    } else if (typeof v === "string") {
      lines.push(`${k} = "${v}"`);
    } else if (typeof v === "boolean" || typeof v === "number") {
      lines.push(`${k} = ${v}`);
    } else if (Array.isArray(v)) {
      lines.push(`${k} = ${JSON.stringify(v)}`);
    }
  }
  return [...lines, ...tables].join("\n");
}

async function encryptJson(data: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(data));
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptJson(encoded: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const data = raw.slice(28);
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function generateJsonSchema(data: unknown): unknown {
  if (data === null) return { type: "null" };
  if (Array.isArray(data)) {
    return { type: "array", items: data.length > 0 ? generateJsonSchema(data[0]) : {} };
  }
  if (typeof data === "object") {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      properties[k] = generateJsonSchema(v);
      if (v !== null && v !== undefined) required.push(k);
    }
    return { type: "object", properties, required };
  }
  return { type: typeof data };
}

function generateHtmlForm(data: unknown, prefix = ""): string {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return "";
  const fields = Object.entries(data as Record<string, unknown>).map(([k, v]) => {
    const name = prefix ? `${prefix}[${k}]` : k;
    const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1");
    if (typeof v === "boolean") {
      return `  <label>\n    <input type="checkbox" name="${name}" ${v ? "checked" : ""} />\n    ${label}\n  </label>`;
    }
    if (typeof v === "number") {
      return `  <label>${label}\n    <input type="number" name="${name}" value="${v}" />\n  </label>`;
    }
    if (typeof v === "string" && v.length > 80) {
      return `  <label>${label}\n    <textarea name="${name}">${v}</textarea>\n  </label>`;
    }
    return `  <label>${label}\n    <input type="text" name="${name}" value="${typeof v === "string" ? v : ""}" />\n  </label>`;
  });
  return `<form>\n${fields.join("\n\n")}\n\n  <button type="submit">Submit</button>\n</form>`;
}

function generateMockData(data: unknown, count = 5): unknown[] {
  if (typeof data !== "object" || data === null) return [];
  const template = Array.isArray(data) && data.length > 0 ? data[0] : data;
  if (typeof template !== "object" || template === null) return [];

  const results: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const item: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) {
      if (typeof v === "string") item[k] = randomString(k, i);
      else if (typeof v === "number") item[k] = Number.isInteger(v) ? Math.floor(Math.random() * 1000) : +(Math.random() * 100).toFixed(2);
      else if (typeof v === "boolean") item[k] = Math.random() > 0.5;
      else if (v === null) item[k] = null;
      else item[k] = v;
    }
    results.push(item);
  }
  return results;
}

function randomString(key: string, idx: number): string {
  const k = key.toLowerCase();
  if (k.includes("email")) return `user${idx + 1}@example.com`;
  if (k.includes("name") && k.includes("first")) return ["Alice", "Bob", "Charlie", "Diana", "Eve"][idx % 5];
  if (k.includes("name") && k.includes("last")) return ["Smith", "Jones", "Brown", "Davis", "Wilson"][idx % 5];
  if (k.includes("name")) return ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Davis", "Eve Wilson"][idx % 5];
  if (k.includes("phone")) return `+1-555-${String(1000 + idx).slice(-4)}`;
  if (k.includes("url") || k.includes("website")) return `https://example.com/${idx + 1}`;
  if (k.includes("id")) return crypto.randomUUID?.() || `id-${idx + 1}`;
  if (k.includes("date") || k.includes("created") || k.includes("updated")) return new Date(Date.now() - idx * 86400000).toISOString();
  if (k.includes("city")) return ["New York", "London", "Tokyo", "Paris", "Berlin"][idx % 5];
  if (k.includes("country")) return ["US", "UK", "JP", "FR", "DE"][idx % 5];
  if (k.includes("status")) return ["active", "inactive", "pending", "archived", "draft"][idx % 5];
  return `${key}_${idx + 1}`;
}

function generateTableView(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) return "Data must be an array of objects for table view.";
  const headers = [...new Set(data.flatMap((item) => (typeof item === "object" && item !== null ? Object.keys(item) : [])))];
  if (!headers.length) return "No object keys found.";
  const headerRow = "| " + headers.join(" | ") + " |";
  const separator = "| " + headers.map(() => "---").join(" | ") + " |";
  const rows = data.map((item) => {
    const obj = item as Record<string, unknown>;
    return "| " + headers.map((h) => {
      const v = obj[h];
      if (v === null || v === undefined) return "";
      return String(v).replace(/\|/g, "\\|");
    }).join(" | ") + " |";
  });
  return [headerRow, separator, ...rows].join("\n");
}

function jsonToCsv(data: unknown): string {
  if (!Array.isArray(data)) {
    throw new Error("CSV conversion requires an array of objects");
  }
  if (data.length === 0) return "";
  const headers = new Set<string>();
  for (const item of data) {
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      Object.keys(item).forEach((k) => headers.add(k));
    } else {
      throw new Error("CSV conversion requires an array of flat objects");
    }
  }
  const cols = Array.from(headers);
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = [cols.join(",")];
  for (const item of data) {
    const obj = item as Record<string, unknown>;
    rows.push(cols.map((c) => escapeCell(obj[c])).join(","));
  }
  return rows.join("\n");
}

function jsonToTypeScript(data: unknown, name = "Root"): string {
  const interfaces: string[] = [];
  const seen = new Map<string, string>();

  function toInterfaceName(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9]/g, "");
  }

  function inferType(value: unknown, key: string): string {
    if (value === null) return "null";
    if (Array.isArray(value)) {
      if (value.length === 0) return "unknown[]";
      const itemType = inferType(value[0], key.replace(/s$/, "Item"));
      return `${itemType}[]`;
    }
    if (typeof value === "object") {
      const ifaceName = toInterfaceName(key);
      if (!seen.has(ifaceName)) {
        seen.set(ifaceName, "");
        generateInterface(value as Record<string, unknown>, ifaceName);
      }
      return ifaceName;
    }
    return typeof value;
  }

  function generateInterface(obj: Record<string, unknown>, ifaceName: string) {
    const fields: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const type = inferType(v, k);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
      fields.push(`  ${safeKey}: ${type};`);
    }
    interfaces.push(`interface ${ifaceName} {\n${fields.join("\n")}\n}`);
  }

  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      generateInterface(data[0] as Record<string, unknown>, name);
      return [...interfaces].reverse().join("\n\n") + `\n\ntype ${name}Array = ${name}[];`;
    }
    return `type ${name} = ${typeof data[0]}[];`;
  }
  if (typeof data === "object" && data !== null) {
    generateInterface(data as Record<string, unknown>, name);
    return [...interfaces].reverse().join("\n\n");
  }
  return `type ${name} = ${typeof data};`;
}

function getJsonStats(input: string): { valid: boolean; size: string; keys: number; depth: number } {
  const size =
    input.length < 1024
      ? `${input.length} B`
      : input.length < 1048576
        ? `${(input.length / 1024).toFixed(1)} KB`
        : `${(input.length / 1048576).toFixed(1)} MB`;

  try {
    const parsed = JSON.parse(input);
    let keys = 0;
    let maxDepth = 0;
    function walk(v: unknown, d: number) {
      if (d > maxDepth) maxDepth = d;
      if (Array.isArray(v)) {
        v.forEach((item) => walk(item, d + 1));
      } else if (typeof v === "object" && v !== null) {
        const entries = Object.entries(v);
        keys += entries.length;
        entries.forEach(([, val]) => walk(val, d + 1));
      }
    }
    walk(parsed, 0);
    return { valid: true, size, keys, depth: maxDepth };
  } catch {
    return { valid: false, size, keys: 0, depth: 0 };
  }
}

function computeDiff(a: string, b: string): { type: "same" | "add" | "remove"; text: string }[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const result: { type: "same" | "add" | "remove"; text: string }[] = [];
  let i = 0, j = 0;

  while (i < linesA.length || j < linesB.length) {
    if (i < linesA.length && j < linesB.length && linesA[i] === linesB[j]) {
      result.push({ type: "same", text: linesA[i] });
      i++;
      j++;
    } else if (j < linesB.length && (i >= linesA.length || !linesB.slice(j).includes(linesA[i]))) {
      result.push({ type: "add", text: linesB[j] });
      j++;
    } else if (i < linesA.length) {
      result.push({ type: "remove", text: linesA[i] });
      i++;
    }
  }
  return result;
}

// ── JSON Schema Validation (draft-07 subset) ────────────────────────────

function validateJsonSchema(data: unknown, schema: unknown): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  const defs: Record<string, unknown> = {};

  if (typeof schema === "object" && schema !== null) {
    const s = schema as Record<string, unknown>;
    if (s.definitions && typeof s.definitions === "object") {
      Object.assign(defs, s.definitions);
    }
    if (s.$defs && typeof s.$defs === "object") {
      Object.assign(defs, s.$defs);
    }
  }

  function resolveRef(s: Record<string, unknown>): Record<string, unknown> {
    if (typeof s.$ref === "string") {
      const refPath = s.$ref as string;
      const match = refPath.match(/^#\/(?:definitions|\$defs)\/(.+)$/);
      if (match && defs[match[1]]) {
        return defs[match[1]] as Record<string, unknown>;
      }
    }
    return s;
  }

  function validate(value: unknown, rawSchema: unknown, path: string) {
    if (typeof rawSchema !== "object" || rawSchema === null) return;
    const s = resolveRef(rawSchema as Record<string, unknown>);

    if (s.type !== undefined) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      const actualType = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
      const matches = types.some((t: unknown) => {
        if (t === "integer") return typeof value === "number" && Number.isInteger(value);
        return t === actualType;
      });
      if (!matches) {
        errors.push({ path: path || "/", message: `Expected type ${types.join(" | ")}, got ${actualType}` });
        return;
      }
    }

    if (s.enum !== undefined && Array.isArray(s.enum)) {
      if (!s.enum.some((e: unknown) => JSON.stringify(e) === JSON.stringify(value))) {
        errors.push({ path: path || "/", message: `Value must be one of: ${JSON.stringify(s.enum)}` });
      }
    }

    if (typeof value === "number") {
      if (s.minimum !== undefined && value < (s.minimum as number)) {
        errors.push({ path, message: `Value ${value} is less than minimum ${s.minimum}` });
      }
      if (s.maximum !== undefined && value > (s.maximum as number)) {
        errors.push({ path, message: `Value ${value} is greater than maximum ${s.maximum}` });
      }
      if (s.exclusiveMinimum !== undefined && value <= (s.exclusiveMinimum as number)) {
        errors.push({ path, message: `Value ${value} must be > ${s.exclusiveMinimum}` });
      }
      if (s.exclusiveMaximum !== undefined && value >= (s.exclusiveMaximum as number)) {
        errors.push({ path, message: `Value ${value} must be < ${s.exclusiveMaximum}` });
      }
    }

    if (typeof value === "string") {
      if (s.minLength !== undefined && value.length < (s.minLength as number)) {
        errors.push({ path, message: `String length ${value.length} is less than minLength ${s.minLength}` });
      }
      if (s.maxLength !== undefined && value.length > (s.maxLength as number)) {
        errors.push({ path, message: `String length ${value.length} exceeds maxLength ${s.maxLength}` });
      }
      if (s.pattern !== undefined) {
        try {
          if (!new RegExp(s.pattern as string).test(value)) {
            errors.push({ path, message: `String does not match pattern ${s.pattern}` });
          }
        } catch { /* skip invalid regex */ }
      }
    }

    if (Array.isArray(value)) {
      if (s.minItems !== undefined && value.length < (s.minItems as number)) {
        errors.push({ path, message: `Array has ${value.length} items, minimum is ${s.minItems}` });
      }
      if (s.maxItems !== undefined && value.length > (s.maxItems as number)) {
        errors.push({ path, message: `Array has ${value.length} items, maximum is ${s.maxItems}` });
      }
      if (s.items !== undefined) {
        value.forEach((item, idx) => {
          validate(item, s.items, `${path}/${idx}`);
        });
      }
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (s.required !== undefined && Array.isArray(s.required)) {
        for (const req of s.required as string[]) {
          if (!(req in obj)) {
            errors.push({ path: `${path}/${req}`, message: `Required property "${req}" is missing` });
          }
        }
      }
      if (s.properties !== undefined && typeof s.properties === "object") {
        const props = s.properties as Record<string, unknown>;
        for (const [k, v] of Object.entries(obj)) {
          if (k in props) {
            validate(v, props[k], `${path}/${k}`);
          } else if (s.additionalProperties === false) {
            errors.push({ path: `${path}/${k}`, message: `Additional property "${k}" is not allowed` });
          } else if (typeof s.additionalProperties === "object" && s.additionalProperties !== null) {
            validate(v, s.additionalProperties, `${path}/${k}`);
          }
        }
      }
    }

    if (s.oneOf !== undefined && Array.isArray(s.oneOf)) {
      const matching = (s.oneOf as unknown[]).filter((sub) => {
        const subErrors: SchemaValidationError[] = [];
        const origLen = errors.length;
        validate(value, sub, path);
        const added = errors.length - origLen;
        errors.splice(origLen, added);
        subErrors.push(...errors.slice(origLen));
        return added === 0;
      });
      if (matching.length !== 1) {
        errors.push({ path, message: `Value must match exactly one of oneOf schemas (matched ${matching.length})` });
      }
    }

    if (s.anyOf !== undefined && Array.isArray(s.anyOf)) {
      const anyMatch = (s.anyOf as unknown[]).some((sub) => {
        const origLen = errors.length;
        validate(value, sub, path);
        const added = errors.length - origLen;
        errors.splice(origLen, added);
        return added === 0;
      });
      if (!anyMatch) {
        errors.push({ path, message: `Value does not match any of the anyOf schemas` });
      }
    }

    if (s.allOf !== undefined && Array.isArray(s.allOf)) {
      for (const sub of s.allOf as unknown[]) {
        validate(value, sub, path);
      }
    }
  }

  validate(data, schema, "");
  return errors;
}

// ── Transform query engine ───────────────────────────────────────────────

function buildQueryFromWizard(wizard: WizardState): string {
  const parts: string[] = ["data"];

  if (wizard.filterField && wizard.filterValue) {
    const val = isNaN(Number(wizard.filterValue)) ? `"${wizard.filterValue}"` : wizard.filterValue;
    if (wizard.filterOp === "contains") {
      parts.push(`.filter(item => String(item.${wizard.filterField}).includes(${val}))`);
    } else if (wizard.filterOp === "startsWith") {
      parts.push(`.filter(item => String(item.${wizard.filterField}).startsWith(${val}))`);
    } else {
      parts.push(`.filter(item => item.${wizard.filterField} ${wizard.filterOp} ${val})`);
    }
  }

  if (wizard.sortField) {
    const dir = wizard.sortDir === "desc" ? -1 : 1;
    parts.push(`.sort((a, b) => a.${wizard.sortField} > b.${wizard.sortField} ? ${dir} : ${-dir})`);
  }

  if (wizard.pickFields.length > 0) {
    const fields = wizard.pickFields.map((f) => `${f}: item.${f}`).join(", ");
    parts.push(`.map(item => ({ ${fields} }))`);
  }

  if (wizard.groupByField) {
    parts.push(`.reduce((acc, item) => { const key = item.${wizard.groupByField}; (acc[key] = acc[key] || []).push(item); return acc; }, {})`);
  }

  if (wizard.uniq) {
    parts.push(`.filter((item, i, arr) => i === arr.findIndex(o => JSON.stringify(o) === JSON.stringify(item)))`);
  }

  return parts.join("\n  ");
}

function executeTransformQuery(data: unknown, query: string): unknown {
  if (!Array.isArray(data)) throw new Error("Transform requires an array as input");
  const fn = new Function("data", `"use strict"; return ${query};`);
  return fn(data);
}

// ── Helpers to deep-get/set/delete by path ───────────────────────────────

function deepGet(obj: unknown, path: (string | number)[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[key as number];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[String(key)];
    } else {
      return undefined;
    }
  }
  return current;
}

function deepSet(obj: unknown, path: (string | number)[], value: unknown): unknown {
  if (path.length === 0) return value;
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj as Record<string, unknown>) };
  const key = path[0];
  if (Array.isArray(clone)) {
    clone[key as number] = deepSet(clone[key as number], path.slice(1), value);
  } else {
    (clone as Record<string, unknown>)[String(key)] = deepSet(
      (clone as Record<string, unknown>)[String(key)],
      path.slice(1),
      value
    );
  }
  return clone;
}

function deepDelete(obj: unknown, path: (string | number)[]): unknown {
  if (path.length === 0) return undefined;
  if (path.length === 1) {
    if (Array.isArray(obj)) {
      const clone = [...obj];
      clone.splice(path[0] as number, 1);
      return clone;
    }
    const clone = { ...(obj as Record<string, unknown>) };
    delete clone[String(path[0])];
    return clone;
  }
  const key = path[0];
  if (Array.isArray(obj)) {
    const clone = [...obj];
    clone[key as number] = deepDelete(clone[key as number], path.slice(1));
    return clone;
  }
  const clone = { ...(obj as Record<string, unknown>) };
  clone[String(key)] = deepDelete(clone[String(key)], path.slice(1));
  return clone;
}

function deepInsert(obj: unknown, path: (string | number)[], key: string | number, value: unknown): unknown {
  const parent = path.length > 0 ? deepGet(obj, path) : obj;
  if (Array.isArray(parent)) {
    const newArr = [...parent, value];
    return path.length > 0 ? deepSet(obj, path, newArr) : newArr;
  }
  if (typeof parent === "object" && parent !== null) {
    const newObj = { ...(parent as Record<string, unknown>), [String(key)]: value };
    return path.length > 0 ? deepSet(obj, path, newObj) : newObj;
  }
  return obj;
}

function getFieldsFromData(data: unknown): string[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (typeof first !== "object" || first === null) return [];
  return Object.keys(first);
}

// ── Tree view components ─────────────────────────────────────────────────

const MAX_TREE_NODES = 10000;

function InteractiveTreeNode({
  nodeKey,
  value,
  depth,
  defaultExpanded = false,
  nodeCount,
  path,
  onUpdate,
  expandAllSignal,
  collapseAllSignal,
  onContextMenu,
  onSelect,
}: {
  nodeKey: string;
  value: unknown;
  depth: number;
  defaultExpanded?: boolean;
  nodeCount: { current: number };
  path: (string | number)[];
  onUpdate: (path: (string | number)[], newValue: unknown) => void;
  expandAllSignal: number;
  collapseAllSignal: number;
  onContextMenu: (e: React.MouseEvent, ctx: ContextMenuState) => void;
  onSelect?: (path: (string | number)[]) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (expandAllSignal > 0) setExpanded(true);
  }, [expandAllSignal]);

  useEffect(() => {
    if (collapseAllSignal > 0) setExpanded(false);
  }, [collapseAllSignal]);

  if (nodeCount.current > MAX_TREE_NODES) {
    return depth === 0 ? (
      <div className="px-3 py-1 text-muted-foreground italic text-sm">
        Tree truncated at {MAX_TREE_NODES.toLocaleString()} nodes...
      </div>
    ) : null;
  }
  nodeCount.current++;

  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const typeLabel = isArray
    ? `array[${value.length}]`
    : isObject
      ? `object{${Object.keys(value).length}}`
      : value === null
        ? "null"
        : typeof value;

  const typeColor = (() => {
    if (typeof value === "string") return "text-success";
    if (typeof value === "number") return "text-blue-500";
    if (typeof value === "boolean") return "text-warning";
    if (value === null) return "text-muted-foreground";
    return "text-foreground";
  })();

  const preview = (() => {
    if (typeof value === "string") return `"${value.length > 60 ? value.slice(0, 60) + "..." : value}"`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value === null) return "null";
    return "";
  })();

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const parentPath = path.slice(0, -1);
    const parentVal = parentPath.length > 0 ? undefined : undefined;
    void parentVal;
    onContextMenu(e, {
      x: e.clientX,
      y: e.clientY,
      path,
      value,
      parentIsArray: false,
    });
  };

  const [nodeCopied, setNodeCopied] = useState(false);
  function copyNodePath(e: React.MouseEvent) {
    e.stopPropagation();
    const jsonpath = path.length === 0 ? "$" : "$" + path.map((p) =>
      typeof p === "number" ? `[${p}]` : /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(p)) ? `.${p}` : `["${p}"]`
    ).join("");
    navigator.clipboard.writeText(jsonpath).then(() => {
      setNodeCopied(true);
      setTimeout(() => setNodeCopied(false), 1500);
    });
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-2 hover:bg-accent/5 rounded cursor-pointer select-none group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => { if (isExpandable) setExpanded(!expanded); onSelect?.(path); }}
        onContextMenu={handleRightClick}
      >
        {isExpandable ? (
          <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="font-mono text-sm text-accent font-medium">{nodeKey}</span>
        <span className="text-muted-foreground text-xs ml-1">{typeLabel}</span>
        {preview && (
          <span className={`font-mono text-sm ml-2 truncate flex-1 ${typeColor}`}>{preview}</span>
        )}
        <button
          onClick={copyNodePath}
          aria-label="Copy JSONPath"
          title="Copy JSONPath"
          className={`ml-auto shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
            nodeCopied
              ? "border-success/40 bg-success/10 text-success"
              : "border-transparent text-muted-foreground/40 group-hover:border-border group-hover:bg-card group-hover:text-muted-foreground hover:!text-accent hover:!border-accent/40"
          }`}
        >
          {nodeCopied ? "✓ copied" : "⎘ path"}
        </button>
      </div>
      {expanded && isExpandable && (
        <div>
          {isArray
            ? value.map((item, idx) => (
                <InteractiveTreeNode
                  key={idx}
                  nodeKey={String(idx)}
                  value={item}
                  depth={depth + 1}
                  nodeCount={nodeCount}
                  path={[...path, idx]}
                  onUpdate={onUpdate}
                  expandAllSignal={expandAllSignal}
                  collapseAllSignal={collapseAllSignal}
                  onContextMenu={onContextMenu}
                  onSelect={onSelect}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <InteractiveTreeNode
                  key={k}
                  nodeKey={k}
                  value={v}
                  depth={depth + 1}
                  nodeCount={nodeCount}
                  path={[...path, k]}
                  onUpdate={onUpdate}
                  expandAllSignal={expandAllSignal}
                  collapseAllSignal={collapseAllSignal}
                  onContextMenu={onContextMenu}
                  onSelect={onSelect}
                />
              ))}
        </div>
      )}
    </div>
  );
}

// ── Mini tree for transform preview ──────────────────────────────────────

function MiniTreeNode({
  nodeKey,
  value,
  depth,
  defaultExpanded = false,
}: {
  nodeKey: string;
  value: unknown;
  depth: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const typeColor = (() => {
    if (typeof value === "string") return "text-success";
    if (typeof value === "number") return "text-blue-500";
    if (typeof value === "boolean") return "text-warning";
    if (value === null) return "text-muted-foreground";
    return "text-foreground";
  })();

  const preview = (() => {
    if (typeof value === "string") return `"${value.length > 40 ? value.slice(0, 40) + "..." : value}"`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value === null) return "null";
    if (isArray) return `[${value.length}]`;
    if (isObject) return `{${Object.keys(value).length}}`;
    return "";
  })();

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 hover:bg-muted/40 rounded cursor-pointer select-none text-xs font-mono"
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {isExpandable ? (
          <span className="w-3 h-3 flex items-center justify-center text-muted-foreground shrink-0">
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-accent">{nodeKey}:</span>
        <span className={`ml-1 truncate ${typeColor}`}>{preview}</span>
      </div>
      {expanded && isExpandable && (
        <div>
          {isArray
            ? value.map((item, idx) => (
                <MiniTreeNode key={idx} nodeKey={String(idx)} value={item} depth={depth + 1} />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <MiniTreeNode key={k} nodeKey={k} value={v} depth={depth + 1} />
              ))}
        </div>
      )}
    </div>
  );
}

// ── Context Menu ─────────────────────────────────────────────────────────

function TreeContextMenu({
  ctx,
  onClose,
  onAction,
}: {
  ctx: ContextMenuState;
  onClose: () => void;
  onAction: (action: string, ctx: ContextMenuState) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items: { label: string; action: string; icon: React.ReactNode; separator?: boolean }[] = [
    { label: "Edit Value", action: "editValue", icon: <Pencil size={13} /> },
    { label: "Edit Key", action: "editKey", icon: <Pencil size={13} /> },
    { label: "Copy Value", action: "copy", icon: <ClipboardCopy size={13} /> },
    { label: "Copy JSONPath", action: "copyPath", icon: <ClipboardCopy size={13} />, separator: true },
    { label: "Paste as Child", action: "paste", icon: <ClipboardPasteIcon size={13} /> },
    { label: "Duplicate", action: "duplicate", icon: <CopyPlus size={13} /> },
    { label: "Extract", action: "extract", icon: <Scissors size={13} />, separator: true },
    { label: "Sort Children", action: "sort", icon: <ArrowDownAZ size={13} /> },
    { label: "Insert Object {}", action: "insertObject", icon: <PlusCircle size={13} />, separator: true },
    { label: "Insert Array []", action: "insertArray", icon: <PlusCircle size={13} /> },
    { label: "Insert Value", action: "insertValue", icon: <PlusCircle size={13} /> },
    { label: "Remove", action: "remove", icon: <Trash2 size={13} />, separator: true },
  ];

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: ctx.x,
    top: ctx.y,
    zIndex: 9999,
  };

  return (
    <div ref={menuRef} style={menuStyle} className="bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px] animate-fade-in">
      {items.map((item, i) => (
        <div key={i}>
          {item.separator && i > 0 && <div className="h-px bg-border my-1" />}
          <button
            className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-muted/60 text-foreground transition-colors"
            onClick={() => {
              onAction(item.action, ctx);
              onClose();
            }}
          >
            <span className="text-muted-foreground">{item.icon}</span>
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────

export default function JsonToolkitPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("format");
  const [convertTarget, setConvertTarget] = useState<ConvertTarget>("yaml");
  const [copied, setCopied] = useState(false);
  const [autoFormat, setAutoFormat] = useState(false);
  const [error, setError] = useState<JsonError | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [diffLeft, setDiffLeft] = useState("");
  const [diffRight, setDiffRight] = useState("");
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [encryptPassword, setEncryptPassword] = useState("");
  const [showEncrypt, setShowEncrypt] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState<"yaml" | "csv" | "env" | "base64">("yaml");
  const [importText, setImportText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback((prev: string) => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    setUndoStack((s) => {
      const next = [...s, prev];
      if (next.length > 50) next.shift();
      return next;
    });
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const prev = s[s.length - 1];
      const rest = s.slice(0, -1);
      setRedoStack((r) => [...r, input]);
      skipHistoryRef.current = true;
      setInput(prev);
      return rest;
    });
  }, [input]);

  const handleRedo = useCallback(() => {
    setRedoStack((s) => {
      if (s.length === 0) return s;
      const next = s[s.length - 1];
      const rest = s.slice(0, -1);
      setUndoStack((u) => [...u, input]);
      skipHistoryRef.current = true;
      setInput(next);
      return rest;
    });
  }, [input]);

  const setInputWithHistory = useCallback((newVal: string | ((prev: string) => string)) => {
    setInput((prev) => {
      const resolved = typeof newVal === "function" ? newVal(prev) : newVal;
      if (resolved !== prev) {
        pushHistory(prev);
      }
      return resolved;
    });
  }, [pushHistory]);

  // Search & Replace
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const searchMatches = useMemo(() => {
    if (!searchTerm || !input) return [];
    try {
      const flags = searchCaseSensitive ? "g" : "gi";
      const pattern = searchRegex ? new RegExp(searchTerm, flags) : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      const matches: { start: number; end: number }[] = [];
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(input)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length });
        if (match[0].length === 0) pattern.lastIndex++;
      }
      return matches;
    } catch {
      return [];
    }
  }, [input, searchTerm, searchCaseSensitive, searchRegex]);

  const handleSearchReplace = useCallback(() => {
    if (searchMatches.length === 0) return;
    const m = searchMatches[currentMatchIndex % searchMatches.length];
    const newInput = input.slice(0, m.start) + replaceTerm + input.slice(m.end);
    setInputWithHistory(newInput);
  }, [searchMatches, currentMatchIndex, input, replaceTerm, setInputWithHistory]);

  const handleSearchReplaceAll = useCallback(() => {
    if (searchMatches.length === 0) return;
    try {
      const flags = searchCaseSensitive ? "g" : "gi";
      const pattern = searchRegex ? new RegExp(searchTerm, flags) : new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      setInputWithHistory(input.replace(pattern, replaceTerm));
    } catch { /* ignore */ }
  }, [searchMatches.length, searchCaseSensitive, searchRegex, searchTerm, input, replaceTerm, setInputWithHistory]);

  // Schema validation
  const [showSchemaPanel, setShowSchemaPanel] = useState(false);
  const [schemaText, setSchemaText] = useState("");
  const [schemaErrors, setSchemaErrors] = useState<SchemaValidationError[] | null>(null);
  const [schemaValid, setSchemaValid] = useState(false);

  const handleSchemaValidate = useCallback(() => {
    try {
      const data = JSON.parse(input);
      const schema = JSON.parse(schemaText);
      const errs = validateJsonSchema(data, schema);
      setSchemaErrors(errs);
      setSchemaValid(errs.length === 0);
    } catch (e) {
      setSchemaErrors([{ path: "/", message: `Parse error: ${(e as Error).message}` }]);
      setSchemaValid(false);
    }
  }, [input, schemaText]);

  // Tree expand/collapse signals
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Drag and drop
  const [dragOver, setDragOver] = useState(false);

  // Transform tab state
  const [transformQuery, setTransformQuery] = useState("data");
  const [transformPreview, setTransformPreview] = useState<unknown>(null);
  const [transformError, setTransformError] = useState<string | null>(null);
  const [wizard, setWizard] = useState<WizardState>({
    filterField: "",
    filterOp: "==",
    filterValue: "",
    sortField: "",
    sortDir: "asc",
    pickFields: [],
    groupByField: "",
    uniq: false,
  });

  // Table tab state
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [tableSortCol, setTableSortCol] = useState<string | null>(null);
  const [tableSortDir, setTableSortDir] = useState<"asc" | "desc">("asc");
  const [tableFilter, setTableFilter] = useState("");
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editingCellValue, setEditingCellValue] = useState("");

  const [selectedTreePath, setSelectedTreePath] = useState<(string | number)[] | null>(null);
  const [pathCopied, setPathCopied] = useState<"jsonpath" | "pointer" | "bracket" | null>(null);
  const [splitView, setSplitView] = useState(false);

  function copyTreePath(format: "jsonpath" | "pointer" | "bracket") {
    if (!selectedTreePath) return;
    let text = "";
    if (format === "jsonpath") {
      text = "$" + selectedTreePath.map((p) =>
        typeof p === "number" ? `[${p}]` : /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(p)) ? `.${p}` : `["${p}"]`
      ).join("");
    } else if (format === "pointer") {
      text = "/" + selectedTreePath.map((p) => String(p).replace(/~/g, "~0").replace(/\//g, "~1")).join("/");
    } else {
      text = "$" + selectedTreePath.map((p) =>
        typeof p === "number" ? `[${p}]` : `['${String(p).replace(/'/g, "\\'")}']`
      ).join("");
    }
    if (!text || text === "$" || text === "/") text = format === "pointer" ? "/" : "$";
    navigator.clipboard.writeText(text).then(() => {
      setPathCopied(format);
      setTimeout(() => setPathCopied(null), 2000);
    });
  }

  const stats = useMemo(() => (input ? getJsonStats(input) : null), [input]);

  const clearError = useCallback(() => {
    setError(null);
    setShowErrorPanel(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  // Populate table data when switching to table tab
  useEffect(() => {
    if (activeTab === "table" && input) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          const items = parsed.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item));
          setTableData(items);
          const hdrs = [...new Set(items.flatMap((item) => Object.keys(item)))];
          setTableHeaders(hdrs);
        }
      } catch { /* ignore */ }
    }
  }, [activeTab, input]);

  // Sync wizard to query
  useEffect(() => {
    const q = buildQueryFromWizard(wizard);
    setTransformQuery(q);
  }, [wizard]);

  // Auto-run transform preview
  useEffect(() => {
    if (activeTab !== "transform" || !input) return;
    try {
      const data = JSON.parse(input);
      const result = executeTransformQuery(data, transformQuery);
      setTransformPreview(result);
      setTransformError(null);
    } catch (e) {
      setTransformError((e as Error).message);
      setTransformPreview(null);
    }
  }, [activeTab, input, transformQuery]);

  const handleFormat = useCallback(() => {
    clearError();
    setFixResult(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      trackToolSuccess(TOOL_SLUG, "format");
    } catch {
      const err = parseJsonError(input);
      if (err) {
        setError(err);
        setShowErrorPanel(true);
        trackToolError(TOOL_SLUG, "format", err.message);
      }
    }
  }, [input, clearError]);

  const handleMinify = useCallback(() => {
    clearError();
    setFixResult(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      trackToolSuccess(TOOL_SLUG, "minify");
    } catch {
      const err = parseJsonError(input);
      if (err) {
        setError(err);
        setShowErrorPanel(true);
        trackToolError(TOOL_SLUG, "minify", err.message);
      }
    }
  }, [input, clearError]);

  const handleFix = useCallback(() => {
    clearError();
    const result = fixCommonMistakes(input);
    setInputWithHistory(result.text);
    setFixResult(result);
    try {
      const parsed = JSON.parse(result.text);
      setOutput(JSON.stringify(parsed, null, 2));
      trackToolSuccess(TOOL_SLUG, "auto_fix", { fixes: result.fixes.length });
    } catch {
      const err = parseJsonError(result.text);
      if (err) {
        setError(err);
        setShowErrorPanel(true);
        trackToolError(TOOL_SLUG, "auto_fix", err.message);
      }
    }
  }, [input, clearError, setInputWithHistory]);

  const handleCopy = useCallback(async () => {
    const textToCopy = activeTab === "convert" || activeTab === "format" || activeTab === "generate" ? output : input;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackToolCopy(TOOL_SLUG, activeTab);
  }, [output, input, activeTab]);

  const handleClear = useCallback(() => {
    setInputWithHistory("");
    setOutput("");
    clearError();
    setFixResult(null);
    setDiffLeft("");
    setDiffRight("");
  }, [clearError, setInputWithHistory]);

  const handleSortKeys = useCallback(() => {
    clearError();
    try {
      const parsed = JSON.parse(input);
      const sorted = sortKeysDeep(parsed);
      const result = JSON.stringify(sorted, null, 2);
      setInputWithHistory(result);
      setOutput(result);
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, clearError, setInputWithHistory]);

  const handleRemoveNulls = useCallback(() => {
    clearError();
    try {
      const parsed = JSON.parse(input);
      const cleaned = removeNullsDeep(parsed);
      const result = JSON.stringify(cleaned, null, 2);
      setInputWithHistory(result);
      setOutput(result);
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, clearError, setInputWithHistory]);

  const handleFlatten = useCallback(() => {
    clearError();
    try {
      const parsed = JSON.parse(input);
      const flat = flattenObject(parsed);
      setOutput(JSON.stringify(flat, null, 2));
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, clearError]);

  const handleUnflatten = useCallback(() => {
    clearError();
    try {
      const parsed = JSON.parse(input);
      const unflat = unflattenObject(parsed as Record<string, unknown>);
      setOutput(JSON.stringify(unflat, null, 2));
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, clearError]);

  const handleNdjson = useCallback(() => {
    clearError();
    try {
      if (input.trim().startsWith("[")) {
        const parsed = JSON.parse(input);
        setOutput(toNdjson(parsed));
      } else {
        const parsed = fromNdjson(input);
        setOutput(JSON.stringify(parsed, null, 2));
      }
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, clearError]);

  const handleEncrypt = useCallback(async () => {
    if (!encryptPassword) return;
    clearError();
    try {
      JSON.parse(input);
      const encrypted = await encryptJson(input, encryptPassword);
      setOutput(encrypted);
    } catch (e) {
      setError({ message: (e as Error).message, line: 1, column: 1 });
      setShowErrorPanel(true);
    }
  }, [input, encryptPassword, clearError]);

  const handleDecrypt = useCallback(async () => {
    if (!encryptPassword) return;
    clearError();
    try {
      const decrypted = await decryptJson(input.trim(), encryptPassword);
      JSON.parse(decrypted);
      setInputWithHistory(decrypted);
      setOutput(JSON.stringify(JSON.parse(decrypted), null, 2));
    } catch {
      setError({ message: "Decryption failed. Wrong password or invalid data.", line: 1, column: 1 });
      setShowErrorPanel(true);
    }
  }, [input, encryptPassword, clearError, setInputWithHistory]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setInputWithHistory(text);
      clearError();
      try {
        const parsed = JSON.parse(text);
        setOutput(JSON.stringify(parsed, null, 2));
      } catch { /* user can fix manually */ }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [clearError, setInputWithHistory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setInputWithHistory(text);
      clearError();
      try {
        const parsed = JSON.parse(text);
        setOutput(JSON.stringify(parsed, null, 2));
      } catch { /* user can fix manually */ }
    };
    reader.readAsText(file);
  }, [clearError, setInputWithHistory]);

  const handleImportConvert = useCallback(() => {
    clearError();
    try {
      let result: unknown;
      switch (importType) {
        case "yaml": result = yaml.load(importText); break;
        case "csv": {
          const lines = importText.trim().split("\n");
          const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
          result = lines.slice(1).map((line) => {
            const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
            return obj;
          });
          break;
        }
        case "env": result = envToJson(importText); break;
        case "base64": {
          const decoded = atob(importText.trim());
          result = JSON.parse(decoded);
          break;
        }
      }
      const json = JSON.stringify(result, null, 2);
      setInputWithHistory(json);
      setOutput(json);
      setShowImport(false);
      setImportText("");
    } catch (e) {
      setError({ message: `Import failed: ${(e as Error).message}`, line: 1, column: 1 });
      setShowErrorPanel(true);
    }
  }, [importType, importText, clearError, setInputWithHistory]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (autoFormat) {
        const text = e.clipboardData.getData("text");
        e.preventDefault();
        setInputWithHistory(text);
        try {
          const parsed = JSON.parse(text);
          setOutput(JSON.stringify(parsed, null, 2));
          clearError();
        } catch {
          const err = parseJsonError(text);
          if (err) {
            setError(err);
            setShowErrorPanel(true);
          }
        }
      }
    },
    [autoFormat, clearError, setInputWithHistory]
  );

  const handleConvert = useCallback(() => {
    clearError();
    try {
      const parsed = JSON.parse(input);
      switch (convertTarget) {
        case "yaml": setOutput(yaml.dump(parsed, { indent: 2, lineWidth: 120 })); break;
        case "csv": setOutput(jsonToCsv(parsed)); break;
        case "typescript": setOutput(jsonToTypeScript(parsed)); break;
        case "env": setOutput(jsonToEnv(parsed)); break;
        case "base64": setOutput(btoa(unescape(encodeURIComponent(input)))); break;
        case "xml": setOutput(jsonToXmlExport(parsed)); break;
        case "toml": setOutput(jsonToToml(parsed)); break;
        case "urlencoded": setOutput(jsonToUrlEncoded(parsed)); break;
        case "schema": setOutput(JSON.stringify(generateJsonSchema(parsed), null, 2)); break;
        case "htmlform": setOutput(generateHtmlForm(parsed)); break;
        case "tableview": setOutput(generateTableView(parsed)); break;
        case "mockdata": setOutput(JSON.stringify(generateMockData(parsed), null, 2)); break;
      }
    } catch {
      const err = parseJsonError(input);
      if (err) { setError(err); setShowErrorPanel(true); }
    }
  }, [input, convertTarget, clearError]);

  useEffect(() => {
    if ((activeTab === "convert" || activeTab === "generate") && input) {
      handleConvert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertTarget]);

  const diffResult = useMemo(() => {
    if (!diffLeft.trim() || !diffRight.trim()) return null;
    try {
      const a = JSON.stringify(JSON.parse(diffLeft), null, 2);
      const b = JSON.stringify(JSON.parse(diffRight), null, 2);
      return computeDiff(a, b);
    } catch {
      return null;
    }
  }, [diffLeft, diffRight]);

  const parsedForTree = useMemo(() => {
    try {
      return JSON.parse(input);
    } catch {
      return undefined;
    }
  }, [input]);

  // Context menu actions
  const handleContextAction = useCallback((action: string, ctx: ContextMenuState) => {
    if (!parsedForTree) return;
    let newData = parsedForTree;

    switch (action) {
      case "copy": {
        const val = deepGet(parsedForTree, ctx.path);
        navigator.clipboard.writeText(JSON.stringify(val, null, 2));
        return;
      }
      case "copyPath": {
        const jsonpath = ctx.path.length === 0 ? "$" : "$" + ctx.path.map((p) =>
          typeof p === "number" ? `[${p}]` : /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(p)) ? `.${p}` : `["${p}"]`
        ).join("");
        navigator.clipboard.writeText(jsonpath);
        return;
      }
      case "paste": {
        navigator.clipboard.readText().then((text) => {
          try {
            const pasted = JSON.parse(text);
            const updated = deepInsert(parsedForTree, ctx.path, "pasted", pasted);
            setInputWithHistory(JSON.stringify(updated, null, 2));
          } catch { /* invalid clipboard content */ }
        });
        return;
      }
      case "extract": {
        const val = deepGet(parsedForTree, ctx.path);
        setInputWithHistory(JSON.stringify(val, null, 2));
        return;
      }
      case "remove": {
        newData = deepDelete(parsedForTree, ctx.path);
        break;
      }
      case "duplicate": {
        const parentPath = ctx.path.slice(0, -1);
        const parent = parentPath.length > 0 ? deepGet(parsedForTree, parentPath) : parsedForTree;
        const val = deepGet(parsedForTree, ctx.path);
        if (Array.isArray(parent)) {
          newData = deepInsert(parsedForTree, parentPath, parent.length, JSON.parse(JSON.stringify(val)));
        } else if (typeof parent === "object" && parent !== null) {
          const key = String(ctx.path[ctx.path.length - 1]);
          const newKey = key + "_copy";
          newData = deepInsert(parsedForTree, parentPath, newKey, JSON.parse(JSON.stringify(val)));
        }
        break;
      }
      case "sort": {
        const val = deepGet(parsedForTree, ctx.path);
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          const sorted = sortKeysDeep(val);
          newData = deepSet(parsedForTree, ctx.path, sorted);
        } else if (Array.isArray(val)) {
          const sorted = [...val].sort((a, b) => {
            if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
            if (typeof a === "number" && typeof b === "number") return a - b;
            return String(a).localeCompare(String(b));
          });
          newData = deepSet(parsedForTree, ctx.path, sorted);
        }
        break;
      }
      case "insertObject": {
        newData = deepInsert(parsedForTree, ctx.path, "newObject", {});
        break;
      }
      case "insertArray": {
        newData = deepInsert(parsedForTree, ctx.path, "newArray", []);
        break;
      }
      case "insertValue": {
        newData = deepInsert(parsedForTree, ctx.path, "newValue", "");
        break;
      }
      case "editValue": {
        const currentVal = deepGet(parsedForTree, ctx.path);
        const newValStr = prompt("Edit value (JSON-compatible):", typeof currentVal === "string" ? currentVal : JSON.stringify(currentVal));
        if (newValStr === null) return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(newValStr);
        } catch {
          parsed = newValStr;
        }
        newData = deepSet(parsedForTree, ctx.path, parsed);
        break;
      }
      case "editKey": {
        if (ctx.path.length === 0) return;
        const oldKey = String(ctx.path[ctx.path.length - 1]);
        const newKey = prompt("Rename key:", oldKey);
        if (!newKey || newKey === oldKey) return;
        const parentPath = ctx.path.slice(0, -1);
        const parent = parentPath.length > 0 ? deepGet(parsedForTree, parentPath) : parsedForTree;
        if (typeof parent === "object" && parent !== null && !Array.isArray(parent)) {
          const entries = Object.entries(parent as Record<string, unknown>);
          const rebuilt: Record<string, unknown> = {};
          for (const [k, v] of entries) {
            rebuilt[k === oldKey ? newKey : k] = v;
          }
          newData = parentPath.length > 0 ? deepSet(parsedForTree, parentPath, rebuilt) : rebuilt;
        }
        break;
      }
      default:
        return;
    }

    setInputWithHistory(JSON.stringify(newData, null, 2));
  }, [parsedForTree, setInputWithHistory]);

  // Table functions
  const sortedFilteredTable = useMemo(() => {
    let data = [...tableData];
    if (tableFilter) {
      const lower = tableFilter.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(lower))
      );
    }
    if (tableSortCol) {
      data.sort((a, b) => {
        const va = a[tableSortCol] ?? "";
        const vb = b[tableSortCol] ?? "";
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return tableSortDir === "desc" ? -cmp : cmp;
      });
    }
    return data;
  }, [tableData, tableFilter, tableSortCol, tableSortDir]);

  const handleTableCellSave = useCallback(() => {
    if (!editingCell) return;
    setTableData((prev) => {
      const next = [...prev];
      const row = { ...next[editingCell.row] };
      let val: unknown = editingCellValue;
      if (editingCellValue === "null") val = null;
      else if (editingCellValue === "true") val = true;
      else if (editingCellValue === "false") val = false;
      else if (!isNaN(Number(editingCellValue)) && editingCellValue.trim() !== "") val = Number(editingCellValue);
      row[editingCell.col] = val;
      next[editingCell.row] = row;
      return next;
    });
    setEditingCell(null);
  }, [editingCell, editingCellValue]);

  const handleTableApply = useCallback(() => {
    setInputWithHistory(JSON.stringify(tableData, null, 2));
  }, [tableData, setInputWithHistory]);

  const handleTableAddRow = useCallback(() => {
    const emptyRow: Record<string, unknown> = {};
    for (const h of tableHeaders) emptyRow[h] = "";
    setTableData((prev) => [...prev, emptyRow]);
  }, [tableHeaders]);

  const handleTableDeleteRow = useCallback((idx: number) => {
    setTableData((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleTransformApply = useCallback(() => {
    if (transformPreview !== null && transformPreview !== undefined) {
      setInputWithHistory(JSON.stringify(transformPreview, null, 2));
    }
  }, [transformPreview, setInputWithHistory]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "format", label: "Format", icon: <Braces size={16} /> },
    { id: "tree", label: "Tree View", icon: <TreePine size={16} /> },
    { id: "diff", label: "Diff", icon: <GitCompareArrows size={16} /> },
    { id: "convert", label: "Convert", icon: <ArrowRightLeft size={16} /> },
    { id: "generate", label: "Generate", icon: <Sparkles size={16} /> },
    { id: "transform", label: "Transform", icon: <Filter size={16} /> },
    { id: "table", label: "Table", icon: <Table2 size={16} /> },
  ];

  const errorLine = error?.line ?? -1;
  const inputLines = input.split("\n");

  const nodeCounter = useRef({ current: 0 });

  const handleTreeUpdate = useCallback((_path: (string | number)[], _newValue: unknown) => {
    // handled via context menu actions
  }, []);

  const handleTreeContextMenu = useCallback((e: React.MouseEvent, ctx: ContextMenuState) => {
    setContextMenu(ctx);
  }, []);

  const wizardFields = useMemo(() => {
    try {
      const data = JSON.parse(input);
      return getFieldsFromData(data);
    } catch {
      return [];
    }
  }, [input]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      {/* Workspace header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FileJson size={22} className="text-accent" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">JSON Toolkit</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <ClipboardPaste size={14} />
            <span className="hidden sm:inline">Auto-format on paste</span>
            <button
              role="switch"
              aria-checked={autoFormat}
              onClick={() => setAutoFormat(!autoFormat)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoFormat ? "bg-accent" : "bg-muted"}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoFormat ? "translate-x-[18px]" : "translate-x-[3px]"}`}
              />
            </button>
          </label>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card px-4 shrink-0">
        <nav className="flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-1.5 shrink-0">
        {activeTab === "format" && (
          <>
            <ToolButton onClick={handleFormat} icon={<Braces size={15} />} label="Format" />
            <ToolButton onClick={handleMinify} icon={<Minimize2 size={15} />} label="Compact" />
            <ToolButton onClick={handleFix} icon={<Wrench size={15} />} label="Fix" variant="warning" />
            <div className="w-px h-5 bg-border mx-0.5" />
            <ToolButton onClick={handleSortKeys} icon={<SortAsc size={15} />} label="Sort Keys" />
            <ToolButton onClick={handleRemoveNulls} icon={<Eraser size={15} />} label="Remove Nulls" />
            <ToolButton onClick={handleFlatten} icon={<Layers size={15} />} label="Flatten" />
            <ToolButton onClick={handleUnflatten} icon={<Expand size={15} />} label="Unflatten" />
            <ToolButton onClick={handleNdjson} icon={<Shuffle size={15} />} label="NDJSON" />
            <div className="w-px h-5 bg-border mx-0.5" />
          </>
        )}
        {activeTab === "tree" && (
          <>
            <ToolButton onClick={() => setExpandAllSignal((s) => s + 1)} icon={<ChevronsUpDown size={15} />} label="Expand All" />
            <ToolButton onClick={() => setCollapseAllSignal((s) => s + 1)} icon={<ChevronsDownUp size={15} />} label="Collapse All" />
            <div className="w-px h-5 bg-border mx-0.5" />
          </>
        )}
        {activeTab === "convert" && (
          <>
            <span className="text-xs text-muted-foreground font-medium">Export:</span>
            <select
              value={convertTarget}
              onChange={(e) => setConvertTarget(e.target.value as ConvertTarget)}
              className="text-sm bg-muted text-foreground border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-ring"
            >
              <optgroup label="Data Formats">
                <option value="yaml">YAML</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="toml">TOML</option>
                <option value="env">.env</option>
                <option value="base64">Base64</option>
                <option value="urlencoded">URL-encoded</option>
              </optgroup>
              <optgroup label="Code">
                <option value="typescript">TypeScript</option>
              </optgroup>
            </select>
            <ToolButton onClick={handleConvert} icon={<ArrowRightLeft size={15} />} label="Convert" />
            <div className="w-px h-5 bg-border mx-0.5" />
            <ToolButton onClick={() => setShowImport(!showImport)} icon={<Upload size={15} />} label="Import" />
            <div className="w-px h-5 bg-border mx-0.5" />
          </>
        )}
        {activeTab === "generate" && (
          <>
            <select
              value={convertTarget}
              onChange={(e) => setConvertTarget(e.target.value as ConvertTarget)}
              className="text-sm bg-muted text-foreground border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="schema">JSON Schema</option>
              <option value="typescript">TypeScript Interfaces</option>
              <option value="htmlform">HTML Form</option>
              <option value="tableview">Table View (Markdown)</option>
              <option value="mockdata">Mock Data (x5)</option>
            </select>
            <ToolButton onClick={handleConvert} icon={<Sparkles size={15} />} label="Generate" />
            <div className="w-px h-5 bg-border mx-0.5" />
          </>
        )}
        <ToolButton onClick={handleUndo} icon={<Undo2 size={15} />} label="Undo" />
        <ToolButton onClick={handleRedo} icon={<Redo2 size={15} />} label="Redo" />
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolButton onClick={() => setShowSearch(!showSearch)} icon={<Search size={15} />} label="Find" />
        <ToolButton onClick={() => setShowSchemaPanel(!showSchemaPanel)} icon={<ShieldCheck size={15} />} label="Validate Schema" />
        <ToolButton
          onClick={handleCopy}
          icon={copied ? <Check size={15} /> : <Copy size={15} />}
          label={copied ? "Copied!" : "Copy"}
          variant={copied ? "success" : "default"}
        />
        <ToolButton onClick={() => setShowEncrypt(!showEncrypt)} icon={<Lock size={15} />} label="Encrypt" />
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={15} />} label="File" />
        <ToolButton onClick={handleClear} icon={<Trash2 size={15} />} label="Clear" variant="danger" />
        <input ref={fileInputRef} type="file" accept=".json,.txt" className="hidden" onChange={handleFileUpload} />
        <div className="w-px h-5 bg-border mx-0.5" />
        <button
          onClick={() => setSplitView((v) => !v)}
          title="Toggle split view (JSON + Tree side by side)"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${splitView ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-accent-light text-foreground"}`}
        >
          <Columns2 size={15} />
          Split
        </button>
      </div>

      {/* Search & Replace bar */}
      {showSearch && (
        <div className="border-b border-border bg-card px-4 py-2 flex flex-wrap items-center gap-2 shrink-0 animate-fade-in">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentMatchIndex(0); }}
            placeholder="Search..."
            aria-label="Search text"
            className="px-2.5 py-1 text-sm rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 w-40"
            autoFocus
          />
          <span className="text-xs text-muted-foreground min-w-[70px]">
            {searchMatches.length > 0 ? `${(currentMatchIndex % searchMatches.length) + 1} of ${searchMatches.length}` : "No matches"}
          </span>
          <button
            onClick={() => setCurrentMatchIndex((i) => (i - 1 + searchMatches.length) % Math.max(searchMatches.length, 1))}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Previous match"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentMatchIndex((i) => (i + 1) % Math.max(searchMatches.length, 1))}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Next match"
          >
            <ChevronRight size={14} />
          </button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <Replace size={14} className="text-muted-foreground" />
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace..."
            aria-label="Replace text"
            className="px-2.5 py-1 text-sm rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 w-40"
          />
          <ToolButton onClick={handleSearchReplace} icon={<Replace size={13} />} label="Replace" />
          <ToolButton onClick={handleSearchReplaceAll} icon={<Replace size={13} />} label="All" />
          <div className="w-px h-5 bg-border mx-0.5" />
          <button
            onClick={() => setSearchCaseSensitive(!searchCaseSensitive)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${searchCaseSensitive ? "border-accent text-accent bg-accent-light" : "border-border text-muted-foreground hover:text-foreground"}`}
            aria-label="Toggle case sensitive"
            aria-pressed={searchCaseSensitive}
          >
            Aa
          </button>
          <button
            onClick={() => setSearchRegex(!searchRegex)}
            className={`px-2 py-1 text-xs rounded border transition-colors font-mono ${searchRegex ? "border-accent text-accent bg-accent-light" : "border-border text-muted-foreground hover:text-foreground"}`}
            aria-label="Toggle regex"
            aria-pressed={searchRegex}
          >
            .*
          </button>
          <button aria-label="Close search" onClick={() => setShowSearch(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      )}

      {/* Schema Validation panel */}
      {showSchemaPanel && (
        <div className="border-b border-border bg-card px-4 py-3 space-y-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium">JSON Schema Validation</span>
            <ToolButton onClick={handleSchemaValidate} icon={<Check size={14} />} label="Validate" />
            <button aria-label="Close schema panel" onClick={() => setShowSchemaPanel(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder='Paste JSON Schema here...\n{\n  "type": "object",\n  "properties": { ... }\n}'
            rows={5}
            spellCheck={false}
            className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/40 scrollbar-thin"
          />
          {schemaErrors !== null && (
            <div className={`rounded-md px-3 py-2 text-xs ${schemaValid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {schemaValid ? (
                <div className="flex items-center gap-1.5"><Check size={14} /> Valid! JSON matches the schema.</div>
              ) : (
                <div className="space-y-1">
                  <div className="font-medium">{schemaErrors.length} validation error{schemaErrors.length !== 1 ? "s" : ""}:</div>
                  {schemaErrors.slice(0, 20).map((err, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-mono text-destructive/70 shrink-0">{err.path || "/"}</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                  {schemaErrors.length > 20 && <div className="italic">...and {schemaErrors.length - 20} more</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Encrypt/Decrypt panel */}
      {showEncrypt && (
        <div className="border-b border-border bg-card px-4 py-2.5 flex flex-wrap items-center gap-2 shrink-0 animate-fade-in">
          <Lock size={14} className="text-muted-foreground" />
          <input
            type="password"
            value={encryptPassword}
            onChange={(e) => setEncryptPassword(e.target.value)}
            placeholder="Password"
            className="px-2.5 py-1 text-sm rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 w-40"
          />
          <ToolButton onClick={handleEncrypt} icon={<Lock size={14} />} label="Encrypt" />
          <ToolButton onClick={handleDecrypt} icon={<Unlock size={14} />} label="Decrypt" />
          <span className="text-xs text-muted-foreground">AES-256-GCM - client-side only</span>
          <button aria-label="Close encrypt panel" onClick={() => setShowEncrypt(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      )}

      {/* Import panel */}
      {showImport && (
        <div className="border-b border-border bg-card px-4 py-3 space-y-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium">Import to JSON from:</span>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as typeof importType)}
              className="text-xs bg-muted text-foreground border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="yaml">YAML</option>
              <option value="csv">CSV</option>
              <option value="env">.env</option>
              <option value="base64">Base64</option>
            </select>
            <ToolButton onClick={handleImportConvert} icon={<ArrowRightLeft size={14} />} label="Convert to JSON" />
            <button aria-label="Close import panel" onClick={() => setShowImport(false)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={importType === "yaml" ? "key: value\nnested:\n  child: 1" : importType === "csv" ? "name,age\nAlice,30\nBob,25" : importType === "env" ? "DB_HOST=localhost\nDB_PORT=5432" : "eyJrZXkiOiJ2YWx1ZSJ9"}
            rows={4}
            spellCheck={false}
            className="w-full px-3 py-2 text-xs rounded-md border border-border bg-background font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/40 scrollbar-thin"
          />
        </div>
      )}

      {/* Fix result banner */}
      {fixResult && fixResult.fixes.length > 0 && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2.5 flex items-start gap-2 shrink-0 animate-fade-in">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning">
              Auto-fixed {fixResult.fixes.length} issue{fixResult.fixes.length > 1 ? "s" : ""}. Review changes before using.
            </p>
            <ul className="mt-1 text-muted-foreground space-y-0.5">
              {fixResult.fixes.map((f, i) => (
                <li key={i}>- {f}</li>
              ))}
            </ul>
          </div>
          <button aria-label="Dismiss fix result" onClick={() => setFixResult(null)} className="ml-auto text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ── Split view (JSON editor + Tree side by side) ───────────────── */}
        {splitView && (
          <div className="flex h-full">
            {/* Left: JSON editor */}
            <div className="flex-1 flex flex-col min-h-0 border-r border-border">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                JSON INPUT
              </div>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInputWithHistory(e.target.value); clearError(); setFixResult(null); }}
                onPaste={(e) => {
                  if (!autoFormat) return;
                  const raw = e.clipboardData.getData("text");
                  e.preventDefault();
                  try {
                    const pretty = JSON.stringify(JSON.parse(raw), null, 2);
                    setInputWithHistory(pretty);
                    clearError();
                  } catch { setInputWithHistory(raw); }
                }}
                spellCheck={false}
                placeholder='Paste or type JSON here…\n\n{\n  "key": "value"\n}'
                className="flex-1 min-h-0 w-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/30 scrollbar-thin"
              />
            </div>

            {/* Right: Tree view */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="px-3 py-1.5 text-xs font-medium bg-muted/50 border-b border-border shrink-0 flex items-center gap-2">
                <span className="font-semibold text-foreground/80">TREE VIEW</span>
                {parsedForTree !== undefined && (
                  <span className="text-accent text-xs">
                    {Array.isArray(parsedForTree) ? `Array[${parsedForTree.length}]` : `Object{${Object.keys(parsedForTree).length}}`}
                  </span>
                )}
              </div>

              {/* Path bar */}
              <div className="shrink-0 border-b border-border bg-card px-3 py-2 flex flex-wrap items-center gap-2 min-h-[38px]">
                {selectedTreePath === null ? (
                  <span className="text-xs text-muted-foreground/50 italic">Click any node → copy its JSONPath</span>
                ) : (
                  <>
                    <span className="font-mono text-xs text-accent truncate flex-1 min-w-0 select-all cursor-text">
                      {selectedTreePath.length === 0 ? "$" : "$" + selectedTreePath.map((p) =>
                        typeof p === "number" ? `[${p}]` : /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(p)) ? `.${p}` : `["${p}"]`
                      ).join("")}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => copyTreePath("jsonpath")} className={`px-2 py-1 text-[10px] rounded-md border font-mono transition-colors ${pathCopied === "jsonpath" ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted hover:bg-accent/10 hover:text-accent"}`}>
                        {pathCopied === "jsonpath" ? "✓" : "JSONPath"}
                      </button>
                      <button onClick={() => copyTreePath("pointer")} className={`px-2 py-1 text-[10px] rounded-md border font-mono transition-colors ${pathCopied === "pointer" ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted hover:bg-accent/10 hover:text-accent"}`}>
                        {pathCopied === "pointer" ? "✓" : "Pointer"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-auto p-2 scrollbar-thin">
                {!input.trim() ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 text-sm gap-2">
                    <span className="text-3xl">{ }</span>
                    <span>Paste JSON on the left to explore the tree</span>
                  </div>
                ) : parsedForTree === undefined ? (
                  <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-xs font-mono m-2">
                    Invalid JSON — check for syntax errors
                  </div>
                ) : (
                  (() => {
                    nodeCounter.current = { current: 0 };
                    return (
                      <InteractiveTreeNode
                        nodeKey="root"
                        value={parsedForTree}
                        depth={0}
                        defaultExpanded
                        nodeCount={nodeCounter.current}
                        path={[]}
                        onUpdate={handleTreeUpdate}
                        expandAllSignal={expandAllSignal}
                        collapseAllSignal={collapseAllSignal}
                        onContextMenu={handleTreeContextMenu}
                        onSelect={setSelectedTreePath}
                      />
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab-based view (hidden when split view is active) ──────────── */}
        {!splitView && activeTab === "format" && (
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                INPUT
              </div>
              <div
                className="flex-1 min-h-0 relative"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {dragOver && (
                  <div className="absolute inset-0 z-10 bg-accent/10 border-2 border-dashed border-accent rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="text-accent font-medium flex items-center gap-2">
                      <Upload size={20} />
                      Drop JSON file here
                    </div>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setInputWithHistory(newVal);
                    clearError();
                    setFixResult(null);
                  }}
                  onPaste={handlePaste}
                  placeholder='Paste or type JSON here...\n{\n  "hello": "world"\n}'
                  spellCheck={false}
                  className="w-full h-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
                />
                {error && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="font-mono text-sm p-4 whitespace-pre leading-[1.625]">
                      {inputLines.map((line, idx) => (
                        <div
                          key={idx}
                          className={idx + 1 === errorLine ? "bg-destructive/15 -mx-4 px-4" : ""}
                        >
                          <span className="invisible">{line || " "}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                OUTPUT
              </div>
              <div className="flex-1 min-h-0">
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                  spellCheck={false}
                  className="w-full h-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
                />
              </div>
            </div>
          </div>
        )}

        {!splitView && activeTab === "tree" && (
          <div className="h-full flex flex-col">
            <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0 flex items-center gap-2">
              <span className="font-semibold text-foreground/80">TREE EXPLORER</span>
              {parsedForTree !== undefined && (
                <span className="text-accent">
                  ({Array.isArray(parsedForTree) ? `Array[${parsedForTree.length}]` : `Object{${Object.keys(parsedForTree).length}}`})
                </span>
              )}
            </div>

            {/* JSONPath display bar — always visible */}
            <div className="shrink-0 border-b border-border bg-card px-3 py-2 flex flex-wrap items-center gap-2 min-h-[38px]">
              {selectedTreePath === null ? (
                <span className="text-xs text-muted-foreground/50 italic flex items-center gap-1.5">
                  <span>⎘</span>
                  Hover a node and click <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">⎘ path</kbd> — or click any row to see its JSONPath here
                </span>
              ) : (
                <>
                  <span className="font-mono text-xs text-accent truncate flex-1 min-w-0 select-all cursor-text" title="Click to select all">
                    {selectedTreePath.length === 0
                      ? "$"
                      : "$" + selectedTreePath.map((p) =>
                          typeof p === "number" ? `[${p}]` : /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(p)) ? `.${p}` : `["${p}"]`
                        ).join("")}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyTreePath("jsonpath")}
                      className={`px-2 py-1 text-[10px] rounded-md border font-mono transition-colors ${pathCopied === "jsonpath" ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted hover:bg-accent/10 hover:border-accent/40 hover:text-accent"}`}
                      title="Copy as JSONPath ($.a.b[0])"
                    >
                      {pathCopied === "jsonpath" ? "✓ copied" : "JSONPath"}
                    </button>
                    <button
                      onClick={() => copyTreePath("pointer")}
                      className={`px-2 py-1 text-[10px] rounded-md border font-mono transition-colors ${pathCopied === "pointer" ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted hover:bg-accent/10 hover:border-accent/40 hover:text-accent"}`}
                      title="Copy as JSON Pointer (/a/b/0)"
                    >
                      {pathCopied === "pointer" ? "✓ copied" : "Pointer"}
                    </button>
                    <button
                      onClick={() => copyTreePath("bracket")}
                      className={`px-2 py-1 text-[10px] rounded-md border font-mono transition-colors ${pathCopied === "bracket" ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted hover:bg-accent/10 hover:border-accent/40 hover:text-accent"}`}
                      title="Copy as bracket notation ($['a']['b'][0])"
                    >
                      {pathCopied === "bracket" ? "✓ copied" : "Bracket"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 overflow-auto p-2 scrollbar-thin">
              {!input.trim() ? (
                <EmptyState message="Paste JSON in the Format tab, then explore it here." />
              ) : parsedForTree === undefined ? (
                <EmptyState message="Invalid JSON. Fix errors in the Format tab first." variant="error" />
              ) : (
                (() => {
                  nodeCounter.current = { current: 0 };
                  return (
                    <InteractiveTreeNode
                      nodeKey="root"
                      value={parsedForTree}
                      depth={0}
                      defaultExpanded
                      nodeCount={nodeCounter.current}
                      path={[]}
                      onUpdate={handleTreeUpdate}
                      expandAllSignal={expandAllSignal}
                      collapseAllSignal={collapseAllSignal}
                      onContextMenu={handleTreeContextMenu}
                      onSelect={setSelectedTreePath}
                    />
                  );
                })()
              )}
            </div>
          </div>
        )}

        {!splitView && activeTab === "diff" && (
          <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  ORIGINAL (A)
                </div>
                <textarea
                  value={diffLeft}
                  onChange={(e) => setDiffLeft(e.target.value)}
                  placeholder="Paste first JSON..."
                  spellCheck={false}
                  className="flex-1 min-h-0 w-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  MODIFIED (B)
                </div>
                <textarea
                  value={diffRight}
                  onChange={(e) => setDiffRight(e.target.value)}
                  placeholder="Paste second JSON..."
                  spellCheck={false}
                  className="flex-1 min-h-0 w-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  DIFF RESULT
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-sm scrollbar-thin">
                  {!diffLeft.trim() && !diffRight.trim() ? (
                    <EmptyState message="Paste two JSON objects to compare." />
                  ) : diffResult === null ? (
                    <EmptyState message="One or both inputs contain invalid JSON." variant="error" />
                  ) : (
                    <div>
                      {diffResult.map((line, idx) => (
                        <div
                          key={idx}
                          className={`px-2 -mx-2 whitespace-pre ${
                            line.type === "add"
                              ? "bg-success/15 text-success"
                              : line.type === "remove"
                                ? "bg-destructive/15 text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          <span className="select-none opacity-60 mr-2">
                            {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
                          </span>
                          {line.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!splitView && (activeTab === "convert" || activeTab === "generate") && (
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                JSON INPUT
              </div>
              <textarea
                value={input}
                onChange={(e) => {
                  setInputWithHistory(e.target.value);
                  clearError();
                }}
                placeholder="Paste JSON to convert..."
                spellCheck={false}
                className="flex-1 min-h-0 w-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0 flex items-center justify-between">
                <span>{convertTarget.toUpperCase()} OUTPUT</span>
                {output && (
                  <button
                    onClick={() => {
                      const blob = new Blob([output], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      const ext = convertTarget === "yaml" ? "yaml" : convertTarget === "csv" ? "csv" : convertTarget === "xml" ? "xml" : convertTarget === "toml" ? "toml" : convertTarget === "env" ? "env" : convertTarget === "typescript" ? "ts" : convertTarget === "htmlform" ? "html" : convertTarget === "schema" ? "json" : "txt";
                      a.download = `output.${ext}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Download size={12} />
                    Download
                  </button>
                )}
              </div>
              <textarea
                value={output}
                readOnly
                placeholder={activeTab === "generate" ? "Generated output will appear here..." : `Converted ${convertTarget.toUpperCase()} will appear here...`}
                spellCheck={false}
                className="flex-1 min-h-0 w-full resize-none bg-background text-foreground font-mono text-sm p-4 outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
              />
            </div>
          </div>
        )}

        {/* Transform Tab */}
        {!splitView && activeTab === "transform" && (
          <div className="h-full flex flex-col">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Wizard + Query */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border flex flex-col shrink-0 overflow-auto">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  TRANSFORM WIZARD
                </div>
                <div className="p-3 space-y-3 text-sm overflow-auto scrollbar-thin">
                  {/* Filter */}
                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter size={12} /> Filter</legend>
                    <select
                      value={wizard.filterField}
                      onChange={(e) => setWizard((w) => ({ ...w, filterField: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select field...</option>
                      {wizardFields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      value={wizard.filterOp}
                      onChange={(e) => setWizard((w) => ({ ...w, filterOp: e.target.value as WizardFilterOp }))}
                      className="w-full text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    >
                      {(["==", "!=", ">", "<", ">=", "<=", "contains", "startsWith"] as const).map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={wizard.filterValue}
                      onChange={(e) => setWizard((w) => ({ ...w, filterValue: e.target.value }))}
                      placeholder="Value..."
                      className="w-full text-xs bg-background border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring/40 font-mono"
                    />
                  </fieldset>

                  {/* Sort */}
                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-medium text-muted-foreground flex items-center gap-1"><SortAsc size={12} /> Sort</legend>
                    <select
                      value={wizard.sortField}
                      onChange={(e) => setWizard((w) => ({ ...w, sortField: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select field...</option>
                      {wizardFields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setWizard((w) => ({ ...w, sortDir: "asc" }))}
                        className={`flex-1 text-xs py-1 rounded border transition-colors ${wizard.sortDir === "asc" ? "bg-accent-light border-accent text-accent" : "border-border text-muted-foreground"}`}
                      >
                        Ascending
                      </button>
                      <button
                        onClick={() => setWizard((w) => ({ ...w, sortDir: "desc" }))}
                        className={`flex-1 text-xs py-1 rounded border transition-colors ${wizard.sortDir === "desc" ? "bg-accent-light border-accent text-accent" : "border-border text-muted-foreground"}`}
                      >
                        Descending
                      </button>
                    </div>
                  </fieldset>

                  {/* Pick */}
                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-medium text-muted-foreground flex items-center gap-1"><FileCode size={12} /> Pick Fields</legend>
                    <div className="flex flex-wrap gap-1">
                      {wizardFields.map((f) => (
                        <button
                          key={f}
                          onClick={() => setWizard((w) => ({
                            ...w,
                            pickFields: w.pickFields.includes(f) ? w.pickFields.filter((x) => x !== f) : [...w.pickFields, f]
                          }))}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${wizard.pickFields.includes(f) ? "bg-accent-light border-accent text-accent" : "border-border text-muted-foreground"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Group By */}
                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-medium text-muted-foreground flex items-center gap-1"><GripVertical size={12} /> Group By</legend>
                    <select
                      value={wizard.groupByField}
                      onChange={(e) => setWizard((w) => ({ ...w, groupByField: e.target.value }))}
                      className="w-full text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">None</option>
                      {wizardFields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </fieldset>

                  {/* Uniq */}
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wizard.uniq}
                      onChange={(e) => setWizard((w) => ({ ...w, uniq: e.target.checked }))}
                      className="rounded border-border"
                    />
                    Remove duplicates (uniq)
                  </label>

                  {/* Query textarea */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Query:</span>
                    <textarea
                      value={transformQuery}
                      onChange={(e) => setTransformQuery(e.target.value)}
                      rows={4}
                      spellCheck={false}
                      className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring/40 scrollbar-thin"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    Examples: <code className="bg-muted px-1 rounded">data.filter(i =&gt; i.age &gt; 25)</code>{" "}
                    <code className="bg-muted px-1 rounded">data.map(i =&gt; i.name)</code>
                  </p>
                  <button
                    onClick={handleTransformApply}
                    disabled={transformPreview === null}
                    className="w-full py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Apply Transform
                  </button>
                </div>
              </div>

              {/* Original preview */}
              <div className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-border">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  ORIGINAL
                </div>
                <div className="flex-1 overflow-auto p-2 scrollbar-thin">
                  {parsedForTree !== undefined ? (
                    <MiniTreeNode nodeKey="root" value={parsedForTree} depth={0} defaultExpanded />
                  ) : (
                    <EmptyState message="No valid JSON input." />
                  )}
                </div>
              </div>

              {/* Preview result */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0">
                  PREVIEW
                </div>
                <div className="flex-1 overflow-auto p-2 scrollbar-thin">
                  {transformError ? (
                    <div className="text-destructive text-xs p-2 font-mono">{transformError}</div>
                  ) : transformPreview !== null ? (
                    <MiniTreeNode nodeKey="result" value={transformPreview} depth={0} defaultExpanded />
                  ) : (
                    <EmptyState message="Write a query to preview the result." />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Tab */}
        {!splitView && activeTab === "table" && (
          <div className="h-full flex flex-col">
            {!Array.isArray(parsedForTree) ? (
              <EmptyState message="Table view requires an array of objects. Paste a JSON array in the Format tab." />
            ) : (
              <>
                <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium bg-muted/50 border-b border-border shrink-0 flex items-center gap-2">
                  <span>TABLE VIEW</span>
                  <span className="text-accent">{tableData.length} rows x {tableHeaders.length} cols</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        placeholder="Filter rows..."
                        className="pl-6 pr-2 py-1 text-xs rounded border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 w-40"
                      />
                    </div>
                    <button
                      onClick={handleTableAddRow}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted hover:bg-accent-light text-foreground transition-colors"
                    >
                      <Plus size={12} /> Add Row
                    </button>
                    <button
                      onClick={handleTableApply}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      <Check size={12} /> Apply Changes
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto scrollbar-thin">
                  <table className="w-full text-sm font-mono border-collapse min-w-max">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-muted/80 backdrop-blur">
                        <th className="px-2 py-1.5 text-xs text-muted-foreground font-medium border-b border-r border-border w-10">#</th>
                        {tableHeaders.map((h) => (
                          <th
                            key={h}
                            className="px-3 py-1.5 text-xs text-left font-medium border-b border-r border-border cursor-pointer select-none hover:bg-accent-light transition-colors"
                            onClick={() => {
                              if (tableSortCol === h) {
                                setTableSortDir((d) => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortCol(h);
                                setTableSortDir("asc");
                              }
                            }}
                          >
                            <span className="flex items-center gap-1">
                              {h}
                              {tableSortCol === h && (
                                <span className="text-accent">{tableSortDir === "asc" ? "\u2191" : "\u2193"}</span>
                              )}
                            </span>
                          </th>
                        ))}
                        <th className="px-2 py-1.5 text-xs text-muted-foreground font-medium border-b border-border w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilteredTable.map((row, rowIdx) => {
                        const realIdx = tableData.indexOf(row);
                        return (
                          <tr key={realIdx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-2 py-1 text-xs text-muted-foreground border-b border-r border-border text-center">{realIdx + 1}</td>
                            {tableHeaders.map((h) => {
                              const isEditing = editingCell?.row === realIdx && editingCell?.col === h;
                              return (
                                <td
                                  key={h}
                                  className="px-3 py-1 border-b border-r border-border text-xs"
                                  onDoubleClick={() => {
                                    setEditingCell({ row: realIdx, col: h });
                                    setEditingCellValue(row[h] === null ? "null" : String(row[h] ?? ""));
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      value={editingCellValue}
                                      onChange={(e) => setEditingCellValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleTableCellSave();
                                        if (e.key === "Escape") setEditingCell(null);
                                      }}
                                      onBlur={handleTableCellSave}
                                      className="w-full px-1 py-0.5 text-xs border border-accent rounded bg-background font-mono outline-none"
                                    />
                                  ) : (
                                    <span className={row[h] === null ? "text-muted-foreground italic" : ""}>
                                      {row[h] === null ? "null" : String(row[h] ?? "")}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-1 py-1 border-b border-border text-center">
                              <button
                                onClick={() => handleTableDeleteRow(realIdx)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                title="Delete row"
                              >
                                <Minus size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {sortedFilteredTable.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">No matching rows.</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        {stats ? (
          <>
            <span className="flex items-center gap-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${stats.valid ? "bg-success" : "bg-destructive"}`}
              />
              {stats.valid ? "Valid JSON" : "Invalid JSON"}
            </span>
            <span>{stats.size}</span>
            {stats.valid && (
              <>
                <span>{stats.keys.toLocaleString()} keys</span>
                <span>Depth: {stats.depth}</span>
              </>
            )}
          </>
        ) : (
          <span>Ready</span>
        )}
        {undoStack.length > 0 && (
          <span className="text-muted-foreground/60">Undo: {undoStack.length}</span>
        )}
        {error && (
          <button
            onClick={() => setShowErrorPanel(!showErrorPanel)}
            className="ml-auto flex items-center gap-1 text-destructive hover:underline"
          >
            <AlertTriangle size={12} />
            Error at line {error.line}, column {error.column}
          </button>
        )}
      </div>

      {/* Error panel */}
      {showErrorPanel && error && (
        <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-3 shrink-0 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  Parse Error -- Line {error.line}, Column {error.column}
                </p>
                <p className="text-muted-foreground mt-0.5 font-mono text-xs">{error.message}</p>
                {errorLine > 0 && errorLine <= inputLines.length && (
                  <pre className="mt-2 bg-muted rounded-lg px-3 py-2 text-xs overflow-x-auto font-mono">
                    <span className="text-muted-foreground select-none">{errorLine} | </span>
                    <span className="text-destructive">{inputLines[errorLine - 1]}</span>
                  </pre>
                )}
              </div>
            </div>
            <button aria-label="Dismiss error" onClick={() => setShowErrorPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <TreeContextMenu
          ctx={contextMenu}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}

function ToolButton({
  onClick,
  icon,
  label,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "success" | "danger" | "warning";
}) {
  const variantClasses = {
    default: "bg-muted hover:bg-accent-light text-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
    warning: "bg-muted hover:bg-warning/10 text-muted-foreground hover:text-warning",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${variantClasses[variant]}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ message, variant = "info" }: { message: string; variant?: "info" | "error" }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
      {variant === "error" ? (
        <AlertTriangle size={32} className="text-destructive/50 mb-2" />
      ) : (
        <FileJson size={32} className="text-muted-foreground/30 mb-2" />
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
}
