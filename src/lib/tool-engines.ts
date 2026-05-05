import yaml from "js-yaml";

type Result = string | { output: string; error?: string };

/** Browsers only expose SubtleCrypto in secure contexts (HTTPS or localhost). */
function requireSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Web Crypto is unavailable (crypto.subtle is missing). Open this site over HTTPS or http://localhost — plain HTTP on a LAN hostname or IP disables AES and hashing in the browser."
    );
  }
  return subtle;
}

// ============================================================
// ENCODING
// ============================================================

export function base64Encode(input: string): Result {
  try {
    return btoa(unescape(encodeURIComponent(input)));
  } catch (e) {
    return { output: "", error: `Encoding failed: ${(e as Error).message}` };
  }
}

export function base64Decode(input: string): Result {
  try {
    return decodeURIComponent(escape(atob(input.trim())));
  } catch {
    return { output: "", error: "Invalid Base64 string" };
  }
}

export function urlEncode(input: string): Result {
  return encodeURIComponent(input);
}

export function urlDecode(input: string): Result {
  try {
    return decodeURIComponent(input);
  } catch {
    return { output: "", error: "Invalid URL-encoded string" };
  }
}

export function htmlEntityEncode(input: string): Result {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlEntityDecode(input: string): Result {
  return input
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

export function textToHex(input: string): Result {
  return Array.from(new TextEncoder().encode(input))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export function hexToText(input: string): Result {
  try {
    const hex = input.replace(/\s+/g, "");
    if (hex.length % 2 !== 0) return { output: "", error: "Hex string must have even length" };
    const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
  } catch {
    return { output: "", error: "Invalid hex string" };
  }
}

export function textToBinary(input: string): Result {
  return Array.from(new TextEncoder().encode(input))
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}

export function binaryToText(input: string): Result {
  try {
    const groups = input.trim().split(/\s+/);
    const bytes = new Uint8Array(groups.map((g) => parseInt(g, 2)));
    return new TextDecoder().decode(bytes);
  } catch {
    return { output: "", error: "Invalid binary string" };
  }
}

export function rot13(input: string): Result {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.",
  "$": "...-..-", "@": ".--.-.",
};
const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

export function morseEncode(input: string): Result {
  if (input.includes(".-") || input.includes("...")) {
    return morseDecode(input);
  }
  return input
    .toUpperCase()
    .split("")
    .map((c) => (c === " " ? "/" : MORSE_MAP[c] || ""))
    .filter(Boolean)
    .join(" ");
}

export function morseDecode(input: string): Result {
  return input
    .split(" / ")
    .map((word) =>
      word
        .split(" ")
        .map((c) => REVERSE_MORSE[c] || "")
        .join("")
    )
    .join(" ");
}

// ============================================================
// TEXT
// ============================================================

export function caseConvert(input: string, targetCase: string): Result {
  const words = input.match(/[a-zA-Z0-9]+/g) || [];
  if (!words.length) return input;

  switch (targetCase) {
    case "camelCase":
      return words
        .map((w, i) =>
          i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join("");
    case "PascalCase":
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    case "snake_case":
      return words.map((w) => w.toLowerCase()).join("_");
    case "kebab-case":
      return words.map((w) => w.toLowerCase()).join("-");
    case "UPPER_CASE":
      return words.map((w) => w.toUpperCase()).join("_");
    case "lower":
      return input.toLowerCase();
    case "Title":
      return input.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "Sentence":
      return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    default:
      return input;
  }
}

export function slugify(input: string): Result {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function wordCount(input: string) {
  const text = input.trim();
  if (!text) return { words: 0, characters: 0, "characters (no spaces)": 0, sentences: 0, paragraphs: 0, "reading time": "0 min", "speaking time": "0 min" };
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+/g) || []).length || (text.length > 0 ? 1 : 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;
  const readingMin = Math.max(1, Math.ceil(words / 200));
  const speakingMin = Math.max(1, Math.ceil(words / 130));
  return {
    words,
    characters: chars,
    "characters (no spaces)": charsNoSpace,
    sentences,
    paragraphs,
    "reading time": `${readingMin} min`,
    "speaking time": `${speakingMin} min`,
  };
}

const LOREM_SENTENCES = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
  "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit.",
  "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.",
  "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis.",
  "Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet.",
  "Viverra maecenas accumsan lacus vel facilisis volutpat est velit.",
];

const LOREM_WORDS = LOREM_SENTENCES.join(" ").split(/\s+/);

export function loremIpsum(count: number, unit: "paragraphs" | "sentences" | "words"): Result {
  count = Math.min(count, 50);
  if (unit === "words") {
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(LOREM_WORDS[i % LOREM_WORDS.length]);
    return result.join(" ");
  }
  if (unit === "sentences") {
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(LOREM_SENTENCES[i % LOREM_SENTENCES.length]);
    return result.join(" ");
  }
  const paras: string[] = [];
  for (let p = 0; p < count; p++) {
    const sentCount = 4 + (p % 3);
    const para: string[] = [];
    for (let s = 0; s < sentCount; s++) {
      para.push(LOREM_SENTENCES[(p * sentCount + s) % LOREM_SENTENCES.length]);
    }
    paras.push(para.join(" "));
  }
  return paras.join("\n\n");
}

export function sortLines(input: string, mode: string): Result {
  const lines = input.split("\n");
  switch (mode) {
    case "asc":
      return lines.sort((a, b) => a.localeCompare(b)).join("\n");
    case "desc":
      return lines.sort((a, b) => b.localeCompare(a)).join("\n");
    case "reverse":
      return lines.reverse().join("\n");
    case "shuffle":
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      return lines.join("\n");
    case "unique": {
      const unique = [...new Set(lines)];
      const removed = lines.length - unique.length;
      return `${unique.join("\n")}\n\n--- Removed ${removed} duplicate(s) ---`;
    }
    default:
      return input;
  }
}

export function findReplace(
  input: string,
  find: string,
  replace: string,
  useRegex: boolean,
  caseInsensitive: boolean
): Result {
  if (!find) return input;
  try {
    if (useRegex) {
      const flags = "g" + (caseInsensitive ? "i" : "");
      const re = new RegExp(find, flags);
      const count = (input.match(re) || []).length;
      return { output: input.replace(re, replace), error: count === 0 ? "No matches found" : undefined };
    }
    const flags = caseInsensitive ? "gi" : "g";
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, flags);
    const count = (input.match(re) || []).length;
    return { output: input.replace(re, replace), error: count === 0 ? "No matches found" : undefined };
  } catch (e) {
    return { output: "", error: `Invalid regex: ${(e as Error).message}` };
  }
}

export function normalizeWhitespace(input: string, mode: string): Result {
  switch (mode) {
    case "collapse":
      return input.replace(/ {2,}/g, " ");
    case "trim":
      return input.split("\n").map((l) => l.trim()).join("\n");
    case "remove-blank":
      return input.split("\n").filter((l) => l.trim()).join("\n");
    case "single-space":
      return input.replace(/\s+/g, " ").trim();
    case "all":
      return input
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l)
        .map((l) => l.replace(/ {2,}/g, " "))
        .join("\n");
    default:
      return input;
  }
}

export function reverseString(input: string): Result {
  return [...input].reverse().join("");
}

export function markdownToHtml(input: string): Result {
  let html = input;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>\n${m}</ul>\n`);
  html = html.replace(/^(?!<[hulo])((?!^\s*$).+)$/gm, "<p>$1</p>");
  return html;
}

export function htmlToMarkdown(input: string): Result {
  let md = input;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1");
  md = md.replace(/<\/?[^>]+(>|$)/g, "");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

export function htmlToText(input: string): Result {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p[^>]*>/gi, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripMarkdown(input: string): Result {
  let text = input;
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");
  text = text.replace(/`(.+?)`/g, "$1");
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/\[(.+?)\]\(.+?\)/g, "$1");
  text = text.replace(/!\[.*?\]\(.+?\)/g, "");
  text = text.replace(/^[-*+]\s+/gm, "");
  text = text.replace(/^\d+\.\s+/gm, "");
  text = text.replace(/^>\s+/gm, "");
  text = text.replace(/---/g, "");
  return text.trim();
}

export function regexTest(input: string, _pattern: string): Result {
  return { output: "", error: "Use the pattern option field above" };
}

export function textDiff(a: string, b: string): Result {
  if (!a && !b) return "";
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const result: string[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);

  let added = 0;
  let removed = 0;

  for (let i = 0; i < maxLen; i++) {
    const la = i < linesA.length ? linesA[i] : undefined;
    const lb = i < linesB.length ? linesB[i] : undefined;

    if (la === lb) {
      result.push(`  ${la}`);
    } else {
      if (la !== undefined) {
        result.push(`- ${la}`);
        removed++;
      }
      if (lb !== undefined) {
        result.push(`+ ${lb}`);
        added++;
      }
    }
  }

  result.unshift(`@@ ${added} addition(s), ${removed} removal(s) @@`);
  return result.join("\n");
}

// ============================================================
// DEV
// ============================================================

export function decodeJwt(input: string): {
  header: unknown;
  payload: unknown;
  signature: string;
  error?: string;
} {
  try {
    const parts = input.trim().split(".");
    if (parts.length !== 3) return { header: null, payload: null, signature: "", error: "Invalid JWT — must have 3 parts separated by dots" };
    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { header, payload, signature: parts[2] };
  } catch (e) {
    return { header: null, payload: null, signature: "", error: `JWT decode failed: ${(e as Error).message}` };
  }
}

export async function generateHash(input: string, algo: string): Promise<Result> {
  try {
    const subtle = requireSubtleCrypto();
    const data = new TextEncoder().encode(input);
    const hash = await subtle.digest(algo, data);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex;
  } catch (e) {
    return { output: "", error: `Hash failed: ${(e as Error).message}` };
  }
}

export function generateUuids(count: number): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < Math.min(count, 25); i++) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    uuids.push(
      `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    );
  }
  return uuids;
}

export function convertColor(input: string): Result {
  const s = input.trim().toLowerCase();
  let r: number, g: number, b: number, a = 1;

  const hexMatch = s.match(/^#?([0-9a-f]{3,8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      return { output: "", error: "Invalid hex color" };
    }
  } else {
    const rgbMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (rgbMatch) {
      r = parseInt(rgbMatch[1]);
      g = parseInt(rgbMatch[2]);
      b = parseInt(rgbMatch[3]);
      a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
    } else {
      const hslMatch = s.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+))?\s*\)/);
      if (hslMatch) {
        const h = parseFloat(hslMatch[1]) / 360;
        const sat = parseFloat(hslMatch[2]) / 100;
        const l = parseFloat(hslMatch[3]) / 100;
        a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
        if (sat === 0) {
          r = g = b = Math.round(l * 255);
        } else {
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };
          const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
          const p = 2 * l - q;
          r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
          g = Math.round(hue2rgb(p, q, h) * 255);
          b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
        }
      } else {
        return { output: "", error: "Unrecognized color format. Use hex (#fff), rgb(r,g,b), or hsl(h,s%,l%)" };
      }
    }
  }

  const hex = `#${[r!, g!, b!].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  const rN = r! / 255, gN = g! / 255, bN = b! / 255;
  const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  let h = 0, sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6;
    else if (max === gN) h = ((bN - rN) / d + 2) / 6;
    else h = ((rN - gN) / d + 4) / 6;
  }

  const lines = [
    `HEX:  ${hex}`,
    `RGB:  rgb(${r!}, ${g!}, ${b!})`,
    `RGBA: rgba(${r!}, ${g!}, ${b!}, ${a})`,
    `HSL:  hsl(${Math.round(h * 360)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`,
    `HSLA: hsla(${Math.round(h * 360)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%, ${a})`,
  ];
  return lines.join("\n");
}

export function unixTimestamp(input: string): Result {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    let ts = parseInt(trimmed);
    if (ts < 1e12) ts *= 1000;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { output: "", error: "Invalid timestamp" };
    return [
      `Unix (s):    ${Math.floor(ts / 1000)}`,
      `Unix (ms):   ${ts}`,
      `UTC:         ${d.toUTCString()}`,
      `Local:       ${d.toLocaleString()}`,
      `ISO 8601:    ${d.toISOString()}`,
    ].join("\n");
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return { output: "", error: "Could not parse date. Try a Unix timestamp or ISO 8601 date." };
  return [
    `Unix (s):    ${Math.floor(d.getTime() / 1000)}`,
    `Unix (ms):   ${d.getTime()}`,
    `UTC:         ${d.toUTCString()}`,
    `Local:       ${d.toLocaleString()}`,
    `ISO 8601:    ${d.toISOString()}`,
  ].join("\n");
}

const CRON_NAMES: Record<number, string[]> = {
  0: ["minute", "0", "59"],
  1: ["hour", "0", "23"],
  2: ["day of month", "1", "31"],
  3: ["month", "1", "12"],
  4: ["day of week", "0", "6"],
};

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseCron(input: string): Result {
  const parts = input.trim().split(/\s+/);
  if (parts.length < 5) return { output: "", error: "Cron expression must have 5 fields: minute hour day month weekday" };

  const descriptions: string[] = [];
  const [min, hr, dom, mon, dow] = parts;

  if (min === "*" && hr === "*") descriptions.push("Every minute");
  else if (min === "0" && hr === "*") descriptions.push("Every hour, at minute 0");
  else if (min !== "*" && hr !== "*" && dom === "*" && mon === "*" && dow === "*")
    descriptions.push(`At ${hr.padStart(2, "0")}:${min.padStart(2, "0")} every day`);
  else {
    if (min !== "*") descriptions.push(`At minute ${min}`);
    if (hr !== "*") descriptions.push(`at hour ${hr}`);
    if (dom !== "*") descriptions.push(`on day ${dom} of the month`);
    if (mon !== "*") {
      const m = parseInt(mon);
      descriptions.push(`in ${MONTH_NAMES[m] || `month ${mon}`}`);
    }
    if (dow !== "*") {
      const d = parseInt(dow);
      descriptions.push(`on ${DAY_NAMES[d] || `weekday ${dow}`}`);
    }
  }

  const now = new Date();
  const nextRuns: string[] = [];
  const check = new Date(now);
  check.setSeconds(0, 0);
  for (let attempts = 0; attempts < 525600 && nextRuns.length < 5; attempts++) {
    check.setMinutes(check.getMinutes() + 1);
    if (matchesCron(check, parts)) {
      nextRuns.push(check.toLocaleString());
    }
  }

  return [
    `Description: ${descriptions.join(", ")}`,
    `Expression:  ${input.trim()}`,
    "",
    "Next 5 runs:",
    ...nextRuns.map((r, i) => `  ${i + 1}. ${r}`),
  ].join("\n");
}

function matchesCron(d: Date, parts: string[]): boolean {
  const vals = [d.getMinutes(), d.getHours(), d.getDate(), d.getMonth() + 1, d.getDay()];
  return parts.slice(0, 5).every((p, i) => matchesField(p, vals[i]));
}

function matchesField(field: string, value: number): boolean {
  if (field === "*") return true;
  return field.split(",").some((part) => {
    if (part.includes("/")) {
      const [range, step] = part.split("/");
      const s = parseInt(step);
      if (range === "*") return value % s === 0;
      const start = parseInt(range);
      return value >= start && (value - start) % s === 0;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      return value >= a && value <= b;
    }
    return parseInt(part) === value;
  });
}

export function generatePassword(
  length: number,
  opts: { uppercase: boolean; lowercase: boolean; digits: boolean; symbols: boolean }
): Result {
  let chars = "";
  if (opts.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.digits) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) return { output: "", error: "Select at least one character set" };

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[arr[i] % chars.length];
  }
  return password;
}

export function parseUrl(input: string): Result {
  try {
    const url = new URL(input);
    const parts = [
      `Protocol:  ${url.protocol}`,
      `Host:      ${url.host}`,
      `Hostname:  ${url.hostname}`,
      `Port:      ${url.port || "(default)"}`,
      `Pathname:  ${url.pathname}`,
      `Search:    ${url.search || "(none)"}`,
      `Hash:      ${url.hash || "(none)"}`,
      `Origin:    ${url.origin}`,
    ];
    if (url.searchParams.toString()) {
      parts.push("", "Query Parameters:");
      url.searchParams.forEach((v, k) => parts.push(`  ${k} = ${v}`));
    }
    return parts.join("\n");
  } catch {
    return { output: "", error: "Invalid URL" };
  }
}

export function convertBase(input: string, fromBase: number, toBase: number): Result {
  try {
    const num = parseInt(input.trim(), fromBase);
    if (isNaN(num)) return { output: "", error: `Invalid number for base ${fromBase}` };
    const result = num.toString(toBase).toUpperCase();
    return [
      `Binary (2):   ${num.toString(2)}`,
      `Octal (8):    ${num.toString(8)}`,
      `Decimal (10): ${num.toString(10)}`,
      `Hex (16):     ${num.toString(16).toUpperCase()}`,
      "",
      `Result (base ${toBase}): ${result}`,
    ].join("\n");
  } catch {
    return { output: "", error: "Conversion failed" };
  }
}

export function minifyCss(input: string): Result {
  const original = input.length;
  const minified = input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
  const saved = original - minified.length;
  const pct = original > 0 ? ((saved / original) * 100).toFixed(1) : "0";
  return `/* Saved ${saved} chars (${pct}%) */\n${minified}`;
}

export function minifyHtml(input: string): Result {
  const original = input.length;
  const minified = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
  const saved = original - minified.length;
  const pct = original > 0 ? ((saved / original) * 100).toFixed(1) : "0";
  return `<!-- Saved ${saved} chars (${pct}%) -->\n${minified}`;
}

export function formatSql(input: string): Result {
  const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "ALTER", "DROP", "TABLE", "INDEX", "AS", "DISTINCT", "UNION", "ALL", "IN", "NOT", "NULL", "IS", "BETWEEN", "LIKE", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "OFFSET"];

  let sql = input;
  keywords.forEach((kw) => {
    const re = new RegExp(`\\b${kw}\\b`, "gi");
    sql = sql.replace(re, kw);
  });

  sql = sql
    .replace(/\s+/g, " ")
    .replace(/\bSELECT\b/g, "\nSELECT")
    .replace(/\bFROM\b/g, "\nFROM")
    .replace(/\bWHERE\b/g, "\nWHERE")
    .replace(/\bAND\b/g, "\n  AND")
    .replace(/\bOR\b/g, "\n  OR")
    .replace(/\b(LEFT |RIGHT |INNER |OUTER )?JOIN\b/g, "\n$1JOIN")
    .replace(/\bON\b/g, "\n  ON")
    .replace(/\bGROUP BY\b/g, "\nGROUP BY")
    .replace(/\bORDER BY\b/g, "\nORDER BY")
    .replace(/\bHAVING\b/g, "\nHAVING")
    .replace(/\bLIMIT\b/g, "\nLIMIT")
    .replace(/\bUNION\b/g, "\nUNION")
    .trim();

  return sql;
}

/** Shell-like tokenizer: splits on whitespace; respects '...' and "..." with \\ escapes in double quotes. */
export function tokenizeShellArgs(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  const n = line.length;
  while (i < n) {
    while (i < n && /\s/.test(line[i])) i++;
    if (i >= n) break;
    const c = line[i];
    if (c === "'") {
      i++;
      let s = "";
      while (i < n && line[i] !== "'") s += line[i++];
      if (line[i] === "'") i++;
      out.push(s);
      continue;
    }
    if (c === '"') {
      i++;
      let s = "";
      while (i < n) {
        if (line[i] === "\\" && i + 1 < n) {
          s += line[i + 1];
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          i++;
          break;
        }
        s += line[i++];
      }
      out.push(s);
      continue;
    }
    let s = "";
    while (i < n && !/\s/.test(line[i])) s += line[i++];
    out.push(s);
  }
  return out;
}

/** Join curl line continuations (`\\\n`) and trim. */
function preprocessCurlRaw(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\\\n[ \t]*/g, " ")
    .trim();
}

function shellSingleQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export type CurlFormatLayout = "multiline" | "oneline";

/**
 * Parse messy cURL input and emit a clean, copy-pasteable command (consistent flags & quoting).
 */
export function formatCurl(input: string, layout: CurlFormatLayout = "multiline"): Result {
  try {
    const pre = preprocessCurlRaw(input);
    if (!pre) return { output: "", error: "Paste a cURL command" };

    const tokens = tokenizeShellArgs(pre);
    if (tokens.length === 0) return { output: "", error: "Could not parse input" };

    const exe = tokens[0].split(/[/\\]/).pop()?.toLowerCase() ?? "";
    if (exe !== "curl") {
      return {
        output: "",
        error: "First token must be curl (e.g. curl or /usr/bin/curl)",
      };
    }

    let i = 1;
    let url = "";
    let urlFromFlag = "";
    let method = "";
    let methodExplicit = false;
    const headers: [string, string][] = [];
    const dataParts: string[] = [];
    let dataKind: "data" | "data-raw" | "data-binary" | "data-urlencode" | "json" | null = null;
    let user: string | null = null;
    let cookie: string | null = null;
    let cookieJar: string | null = null;
    const forms: string[] = [];
    const booleans = new Set<string>();
    const passthrough: string[] = [];

    const takeBool = (short: string, long?: string) => {
      booleans.add(short);
      if (long) booleans.add(long);
    };

    const splitOpt = (tok: string): [string, string | null] => {
      const eq = tok.indexOf("=");
      if (eq === -1) return [tok, null];
      return [tok.slice(0, eq), tok.slice(eq + 1)];
    };

    while (i < tokens.length) {
      let tok = tokens[i];
      if (/^https?:\/\//i.test(tok)) {
        url = tok;
        i++;
        continue;
      }

      if (!tok.startsWith("-")) {
        passthrough.push(tok);
        i++;
        continue;
      }

      let opt = tok;
      let inlineVal: string | null = null;
      if (opt.includes("=")) {
        const [o, v] = splitOpt(opt);
        opt = o;
        inlineVal = v ?? "";
      }

      const next = () => {
        if (inlineVal !== null) {
          const v = inlineVal;
          inlineVal = null;
          return v;
        }
        if (i + 1 >= tokens.length) return "";
        i++;
        return tokens[i];
      };

      const optNorm = opt.replace(/^--/, "-");

      if (optNorm === "-X" || opt === "--request") {
        method = next().toUpperCase();
        methodExplicit = true;
        i++;
        continue;
      }
      if (optNorm === "-H" || opt === "--header") {
        const h = next();
        const colon = h.indexOf(":");
        if (colon === -1) {
          headers.push([h.trim(), ""]);
        } else {
          headers.push([h.slice(0, colon).trim(), h.slice(colon + 1).trim()]);
        }
        i++;
        continue;
      }
      if (
        optNorm === "-d" ||
        opt === "--data" ||
        opt === "--data-raw" ||
        opt === "--data-binary" ||
        opt === "--data-urlencode"
      ) {
        const body = next();
        dataParts.push(body);
        if (opt === "--data-raw" || optNorm === "-d") dataKind = "data-raw";
        else if (opt === "--data-binary") dataKind = "data-binary";
        else if (opt === "--data-urlencode") dataKind = "data-urlencode";
        else dataKind = dataKind || "data";
        i++;
        continue;
      }
      if (opt === "--json") {
        const body = next();
        dataParts.push(body);
        dataKind = "json";
        i++;
        continue;
      }
      if (optNorm === "-u" || opt === "--user") {
        user = next();
        i++;
        continue;
      }
      if (optNorm === "-b" || opt === "--cookie") {
        cookie = next();
        i++;
        continue;
      }
      if (optNorm === "-c" || opt === "--cookie-jar") {
        cookieJar = next();
        i++;
        continue;
      }
      if (opt === "--url") {
        urlFromFlag = next();
        i++;
        continue;
      }
      if (optNorm === "-F" || opt === "--form") {
        forms.push(next());
        i++;
        continue;
      }
      if (optNorm === "-L" || opt === "--location") {
        takeBool("L", "location");
        i++;
        continue;
      }
      if (optNorm === "-k" || opt === "--insecure") {
        takeBool("k", "insecure");
        i++;
        continue;
      }
      if (optNorm === "-s" || opt === "--silent") {
        takeBool("s", "silent");
        i++;
        continue;
      }
      if (opt === "-S" || opt === "--show-error") {
        takeBool("S", "show-error");
        i++;
        continue;
      }
      if (optNorm === "-i" || opt === "--include") {
        takeBool("i", "include");
        i++;
        continue;
      }
      if (opt === "--compressed") {
        takeBool("compressed");
        i++;
        continue;
      }
      if (optNorm === "-v" || opt === "--verbose") {
        takeBool("v", "verbose");
        i++;
        continue;
      }

      const val = inlineVal !== null ? inlineVal : i + 1 < tokens.length && !tokens[i + 1].startsWith("-") ? tokens[++i] : null;
      if (val !== null) passthrough.push(opt, val);
      else passthrough.push(opt);
      i++;
    }

    const finalUrl = url || urlFromFlag;
    if (!finalUrl) {
      return {
        output: "",
        error: "No URL found — include https://... or --url",
      };
    }

    let outMethod = method || "GET";
    if (!methodExplicit && dataParts.length > 0 && outMethod === "GET") {
      outMethod = "POST";
    }

    const mergedData =
      dataParts.length === 0
        ? null
        : dataParts.length === 1
          ? dataParts[0]
          : dataParts.join("&");

    const flagOrder: { key: string; long: string }[] = [
      { key: "location", long: "--location" },
      { key: "insecure", long: "--insecure" },
      { key: "silent", long: "--silent" },
      { key: "show-error", long: "--show-error" },
      { key: "include", long: "--include" },
      { key: "compressed", long: "--compressed" },
      { key: "verbose", long: "--verbose" },
    ];

    const parts: string[] = ["curl"];

    for (const { key, long } of flagOrder) {
      if (booleans.has(key) || booleans.has(long.replace(/^--/, ""))) {
        parts.push(long);
      }
    }

    if (outMethod !== "GET" || methodExplicit) {
      parts.push("-X", outMethod);
    }

    if (user) {
      parts.push("-u", shellSingleQuote(user));
    }
    if (cookie) {
      parts.push("-b", shellSingleQuote(cookie));
    }
    if (cookieJar) {
      parts.push("-c", shellSingleQuote(cookieJar));
    }

    for (const [hk, hv] of headers) {
      parts.push("-H", shellSingleQuote(`${hk}: ${hv}`));
    }

    if (mergedData !== null) {
      if (dataKind === "json") {
        parts.push("--json", shellSingleQuote(mergedData));
      } else {
        const dataFlag =
          dataKind === "data-binary"
            ? "--data-binary"
            : dataKind === "data-urlencode"
              ? "--data-urlencode"
              : "--data-raw";
        parts.push(dataFlag, shellSingleQuote(mergedData));
      }
    }

    for (const f of forms) {
      parts.push("-F", shellSingleQuote(f));
    }

    for (let j = 0; j < passthrough.length; j++) {
      parts.push(passthrough[j]);
    }

    parts.push(shellSingleQuote(finalUrl));

    if (layout === "oneline") {
      return parts.join(" ");
    }

    const lines: string[] = [];
    lines.push("curl \\");
    for (let k = 1; k < parts.length; k++) {
      const isLast = k === parts.length - 1;
      const seg = parts[k];
      lines.push(`  ${seg}${isLast ? "" : " \\"}`);
    }
    return lines.join("\n");
  } catch (e) {
    return { output: "", error: `Could not format cURL: ${(e as Error).message}` };
  }
}

export function curlToFetch(input: string): Result {
  try {
    const args = input.trim();
    if (!args.startsWith("curl")) return { output: "", error: "Input must start with 'curl'" };

    let url = "";
    let method = "GET";
    const headers: Record<string, string> = {};
    let body = "";

    const urlMatch = args.match(/curl\s+(?:(?:-[A-Za-z]+\s+\S+\s+)*?)['"]?(https?:\/\/[^\s'"]+)['"]?/);
    if (urlMatch) url = urlMatch[1];
    else {
      const fallback = args.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
      if (fallback) url = fallback[1];
    }

    const methodMatch = args.match(/-X\s+(\w+)/);
    if (methodMatch) method = methodMatch[1].toUpperCase();

    const headerMatches = args.matchAll(/-H\s+['"]([^'"]+)['"]/g);
    for (const m of headerMatches) {
      const [key, ...val] = m[1].split(":");
      headers[key.trim()] = val.join(":").trim();
    }

    const bodyMatch = args.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/);

    if (bodyMatch) {
      body = bodyMatch[1];
      if (method === "GET") method = "POST";
    }

    let code = `const response = await fetch("${url}", {\n  method: "${method}",\n`;
    if (Object.keys(headers).length) {
      code += `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")},\n`;
    }
    if (body) {
      code += `  body: ${JSON.stringify(body)},\n`;
    }
    code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
    return code;
  } catch {
    return { output: "", error: "Could not parse cURL command" };
  }
}

export function escapeString(input: string, mode: "json" | "js" | "sql" | "regex"): Result {
  switch (mode) {
    case "json":
      return JSON.stringify(input);
    case "js":
      return input
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    case "sql":
      return input.replace(/'/g, "''");
    case "regex":
      return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    default:
      return input;
  }
}

export function mimeLookup(input: string): Result {
  const MIMES: Record<string, string> = {
    html: "text/html", htm: "text/html", css: "text/css", js: "application/javascript",
    mjs: "application/javascript", json: "application/json", xml: "application/xml",
    txt: "text/plain", csv: "text/csv", md: "text/markdown",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    svg: "image/svg+xml", webp: "image/webp", ico: "image/x-icon", avif: "image/avif",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
    mp4: "video/mp4", webm: "video/webm", avi: "video/x-msvideo", mkv: "video/x-matroska",
    pdf: "application/pdf", zip: "application/zip", gz: "application/gzip",
    tar: "application/x-tar", "7z": "application/x-7z-compressed",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf",
    yaml: "application/yaml", yml: "application/yaml", toml: "application/toml",
    ts: "application/typescript", tsx: "application/typescript",
    wasm: "application/wasm", map: "application/json",
  };

  const ext = input.trim().toLowerCase().replace(/^\./, "");
  if (MIMES[ext]) {
    return `Extension: .${ext}\nMIME Type: ${MIMES[ext]}`;
  }

  const matches = Object.entries(MIMES).filter(
    ([k, v]) => k.includes(ext) || v.includes(ext)
  );
  if (matches.length) {
    return matches.map(([k, v]) => `.${k} → ${v}`).join("\n");
  }
  return { output: "", error: `No MIME type found for "${input}"` };
}

// ============================================================
// CONVERSION
// ============================================================

export function convertTemperature(value: number, from: "C" | "F" | "K"): Result {
  let c: number, f: number, k: number;
  switch (from) {
    case "C": c = value; f = (value * 9) / 5 + 32; k = value + 273.15; break;
    case "F": c = ((value - 32) * 5) / 9; f = value; k = ((value - 32) * 5) / 9 + 273.15; break;
    case "K": c = value - 273.15; f = ((value - 273.15) * 9) / 5 + 32; k = value; break;
  }
  return [
    `Celsius:    ${c!.toFixed(2)} °C`,
    `Fahrenheit: ${f!.toFixed(2)} °F`,
    `Kelvin:     ${k!.toFixed(2)} K`,
  ].join("\n");
}

export function convertBytes(value: number, fromUnit: string): Result {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const idx = units.indexOf(fromUnit);
  if (idx === -1) return { output: "", error: "Unknown unit" };
  const bytes = value * Math.pow(1024, idx);
  return units
    .map((u, i) => {
      const val = bytes / Math.pow(1024, i);
      return `${u}:  ${val >= 0.01 ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : val.toExponential(2)}`;
    })
    .join("\n");
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numToWordsHelper(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + numToWordsHelper(n % 100) : "");
  if (n < 1000000) return numToWordsHelper(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + numToWordsHelper(n % 1000) : "");
  if (n < 1000000000) return numToWordsHelper(Math.floor(n / 1000000)) + " million" + (n % 1000000 ? " " + numToWordsHelper(n % 1000000) : "");
  if (n < 1000000000000) return numToWordsHelper(Math.floor(n / 1000000000)) + " billion" + (n % 1000000000 ? " " + numToWordsHelper(n % 1000000000) : "");
  return numToWordsHelper(Math.floor(n / 1000000000000)) + " trillion" + (n % 1000000000000 ? " " + numToWordsHelper(n % 1000000000000) : "");
}

export function numberToWords(n: number): Result {
  if (n === 0) return "zero";
  const neg = n < 0;
  return (neg ? "negative " : "") + numToWordsHelper(Math.abs(n));
}

export function toRomanNumeral(n: number): Result {
  if (n <= 0 || n > 3999) return { output: "", error: "Number must be between 1 and 3999" };
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

export function fromRomanNumeral(s: string): number | string {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  if (!/^[IVXLCDM]+$/.test(s)) return "Invalid Roman numeral";
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    const curr = map[s[i]];
    const next = map[s[i + 1]];
    if (next > curr) {
      result += next - curr;
      i++;
    } else {
      result += curr;
    }
  }
  return result;
}

export function convertDuration(seconds: number): Result {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  const parts: string[] = [];
  if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s || !parts.length) parts.push(`${s} second${s !== 1 ? "s" : ""}`);
  if (ms) parts.push(`${ms} millisecond${ms !== 1 ? "s" : ""}`);

  return [
    `HH:MM:SS:   ${hh}:${mm}:${ss}`,
    `Breakdown:   ${parts.join(", ")}`,
    "",
    `Total seconds:      ${Math.floor(seconds).toLocaleString()}`,
    `Total minutes:      ${(seconds / 60).toFixed(2)}`,
    `Total hours:        ${(seconds / 3600).toFixed(4)}`,
    `Total days:         ${(seconds / 86400).toFixed(6)}`,
  ].join("\n");
}

export function calculatePercentage(input: string): Result {
  const lines = input.trim().split("\n").filter(Boolean);
  const results: string[] = [];

  for (const line of lines) {
    const pctOf = line.match(/([\d.]+)%?\s*of\s*([\d.]+)/i);
    if (pctOf) {
      const pct = parseFloat(pctOf[1]);
      const total = parseFloat(pctOf[2]);
      results.push(`${pct}% of ${total} = ${(pct / 100) * total}`);
      continue;
    }
    const whatPct = line.match(/([\d.]+)\s*(?:is\s*)?(?:what\s*%|percentage)\s*(?:of\s*)?([\d.]+)/i);
    if (whatPct) {
      const part = parseFloat(whatPct[1]);
      const total = parseFloat(whatPct[2]);
      results.push(`${part} is ${((part / total) * 100).toFixed(2)}% of ${total}`);
      continue;
    }
    const nums = line.match(/[\d.]+/g);
    if (nums && nums.length >= 2) {
      const a = parseFloat(nums[0]);
      const b = parseFloat(nums[1]);
      results.push(`${a} → ${b}: ${(((b - a) / Math.abs(a)) * 100).toFixed(2)}% change`);
    } else {
      results.push(`Could not parse: "${line}"`);
    }
  }
  return results.join("\n");
}

export function calculateAspectRatio(width: number, height: number): Result {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const g = gcd(Math.round(width), Math.round(height));
  const rw = Math.round(width) / g;
  const rh = Math.round(height) / g;
  const decimal = (width / height).toFixed(4);

  const standards = [
    { name: "1:1", val: 1 },
    { name: "4:3", val: 4 / 3 },
    { name: "3:2", val: 3 / 2 },
    { name: "16:10", val: 16 / 10 },
    { name: "16:9", val: 16 / 9 },
    { name: "21:9", val: 21 / 9 },
    { name: "9:16", val: 9 / 16 },
    { name: "3:4", val: 3 / 4 },
  ];
  const ratio = width / height;
  const closest = standards.reduce((prev, curr) =>
    Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
  );

  return [
    `Dimensions:     ${width} × ${height}`,
    `Aspect Ratio:   ${rw}:${rh}`,
    `Decimal:        ${decimal}`,
    `Closest Common: ${closest.name}`,
  ].join("\n");
}

export function convertTimezone(input: string): Result {
  const now = new Date();
  const zones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
    "Australia/Sydney", "Pacific/Auckland",
  ];
  const dateToUse = input.trim() ? new Date(input.trim()) : now;
  if (isNaN(dateToUse.getTime())) return { output: "", error: "Invalid date. Enter a date/time or leave empty for current time." };

  return zones
    .map((tz) => {
      const str = dateToUse.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return `${tz.padEnd(24)} ${str}`;
    })
    .join("\n");
}

// ── Finance / health / math / datetime (calculator-style tools; key=value lines) ──

function parseCalcKV(input: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const raw of input.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]\s*(.+)$/);
    if (m) r[m[1].toLowerCase()] = m[2].trim();
  }
  return r;
}

function kvNum(kv: Record<string, string>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = kv[k];
    if (v !== undefined && v !== "") {
      const n = parseFloat(v.replace(/,/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function gcdTwo(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function mifflinBmr(weightKg: number, heightCm: number, age: number, female: boolean): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return female ? base - 161 : base + 5;
}

export function calcSimpleInterest(input: string): Result {
  const kv = parseCalcKV(input);
  const p = kvNum(kv, "p", "principal");
  const r = kvNum(kv, "r", "rate");
  const t = kvNum(kv, "t", "time", "years");
  if (p === undefined || r === undefined || t === undefined) {
    return {
      output: "",
      error:
        "Example:\nprincipal=1000\nrate=5\ntime=2\n(rate = % per year, time = years)",
    };
  }
  const si = (p * r * t) / 100;
  const total = p + si;
  return [
    `Principal:    ${p}`,
    `Rate:         ${r}% / year`,
    `Time:         ${t} years`,
    `Interest:     ${si.toFixed(2)}`,
    `Total owed:   ${total.toFixed(2)}`,
  ].join("\n");
}

export function calcGst(input: string, basis: "exclusive" | "inclusive"): Result {
  const kv = parseCalcKV(input);
  const amount = kvNum(kv, "amount", "amt", "a");
  const rate = kvNum(kv, "rate", "gst", "g");
  if (amount === undefined || rate === undefined) {
    return { output: "", error: "amount=1000\nrate=18" };
  }
  if (basis === "exclusive") {
    const gstAmt = (amount * rate) / 100;
    const gross = amount + gstAmt;
    return [
      `Net (before GST): ${amount.toFixed(2)}`,
      `GST (${rate}%):   ${gstAmt.toFixed(2)}`,
      `Gross total:      ${gross.toFixed(2)}`,
    ].join("\n");
  }
  const net = (amount * 100) / (100 + rate);
  const gstAmt = amount - net;
  return [
    `Gross (incl. GST): ${amount.toFixed(2)}`,
    `Net (taxable):     ${net.toFixed(2)}`,
    `GST (${rate}%):    ${gstAmt.toFixed(2)}`,
  ].join("\n");
}

export function calcDiscount(input: string): Result {
  const kv = parseCalcKV(input);
  const price = kvNum(kv, "price", "list", "mrp");
  const d = kvNum(kv, "discount", "d", "off");
  if (price === undefined || d === undefined) {
    return { output: "", error: "price=100\ndiscount=15   (% off list price)" };
  }
  const saved = (price * d) / 100;
  const sale = price - saved;
  return [
    `List price:       ${price.toFixed(2)}`,
    `Discount (${d}%): ${saved.toFixed(2)}`,
    `Sale price:       ${sale.toFixed(2)}`,
  ].join("\n");
}

export function calcTip(input: string): Result {
  const kv = parseCalcKV(input);
  const bill = kvNum(kv, "bill", "amount");
  const tipPct = kvNum(kv, "tip", "percent");
  const split = kvNum(kv, "split", "people", "p") ?? 1;
  if (bill === undefined || tipPct === undefined) {
    return { output: "", error: "bill=50\ntip=18\nsplit=4   (split optional, default 1)" };
  }
  const tipAmt = (bill * tipPct) / 100;
  const total = bill + tipAmt;
  const per = total / Math.max(1, Math.round(split));
  const lines = [
    `Bill:            ${bill.toFixed(2)}`,
    `Tip (${tipPct}%): ${tipAmt.toFixed(2)}`,
    `Total:           ${total.toFixed(2)}`,
  ];
  if (split > 1) lines.push(`Per person (${Math.round(split)}): ${per.toFixed(2)}`);
  return lines.join("\n");
}

export function calcRoi(input: string): Result {
  const kv = parseCalcKV(input);
  const cost = kvNum(kv, "cost", "invested");
  const gain = kvNum(kv, "gain", "value", "current");
  const profitOnly = kvNum(kv, "profit");
  if (cost !== undefined && profitOnly !== undefined) {
    const roi = (profitOnly / cost) * 100;
    return [
      `Investment / cost: ${cost}`,
      `Profit:            ${profitOnly}`,
      `ROI:               ${roi.toFixed(2)}%`,
    ].join("\n");
  }
  if (cost === undefined || gain === undefined) {
    return {
      output: "",
      error: "cost=100\ngain=120   (final value)\nor cost=100 profit=20",
    };
  }
  const profit = gain - cost;
  const roi = (profit / cost) * 100;
  return [
    `Cost:      ${cost}`,
    `Returned:  ${gain}`,
    `Profit:    ${profit.toFixed(2)}`,
    `ROI:       ${roi.toFixed(2)}%`,
  ].join("\n");
}

export function calcProfitLoss(input: string): Result {
  const kv = parseCalcKV(input);
  const revenue = kvNum(kv, "revenue", "sales");
  const cost = kvNum(kv, "cost", "cogs");
  if (revenue === undefined || cost === undefined) {
    return { output: "", error: "revenue=120\ncost=80" };
  }
  const profit = revenue - cost;
  const margin = revenue !== 0 ? (profit / revenue) * 100 : 0;
  const markup = cost !== 0 ? (profit / cost) * 100 : 0;
  return [
    `Revenue:       ${revenue.toFixed(2)}`,
    `Cost:          ${cost.toFixed(2)}`,
    `Profit / loss: ${profit.toFixed(2)}`,
    `Margin (rev):  ${margin.toFixed(2)}%`,
    `Markup (cost): ${markup.toFixed(2)}%`,
  ].join("\n");
}

export function calcBmr(input: string): Result {
  const kv = parseCalcKV(input);
  const w = kvNum(kv, "weight", "w");
  const h = kvNum(kv, "height");
  const age = kvNum(kv, "age", "a");
  const female = /^f/i.test(kv.sex || kv.gender || "m");
  if (w === undefined || h === undefined || age === undefined) {
    return {
      output: "",
      error: "weight=70 (kg)\nheight=175 (cm)\nage=30\nsex=m or f   (Mifflin–St Jeor)",
    };
  }
  const bmr = mifflinBmr(w, h, age, female);
  return [
    `BMR: ~${bmr.toFixed(0)} kcal/day`,
    `(${female ? "female" : "male"}, Mifflin–St Jeor)`,
    "",
    "TDEE multipliers (× BMR): sedentary 1.2 · light 1.375 · moderate 1.55 · active 1.725 · very 1.9",
  ].join("\n");
}

export function calcCalorieCalculator(input: string): Result {
  const kv = parseCalcKV(input);
  const w = kvNum(kv, "weight", "w");
  const h = kvNum(kv, "height");
  const age = kvNum(kv, "age", "a");
  const female = /^f/i.test(kv.sex || kv.gender || "m");
  const level = (kv.activity || kv.level || "moderate").toLowerCase();
  const map: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very: 1.9,
    extra: 1.9,
  };
  const mult = map[level] ?? 1.55;
  if (w === undefined || h === undefined || age === undefined) {
    return {
      output: "",
      error:
        "weight=70\nheight=175\nage=30\nsex=m\nactivity=moderate\n(activity: sedentary|light|moderate|active|very)",
    };
  }
  const bmr = mifflinBmr(w, h, age, female);
  const tdee = bmr * mult;
  return [
    `BMR:              ~${bmr.toFixed(0)} kcal/day`,
    `Activity level: ${level} (×${mult})`,
    `TDEE (estimate): ~${tdee.toFixed(0)} kcal/day`,
    "",
    "Estimates only — not medical advice.",
  ].join("\n");
}

export function calcWaterIntake(input: string): Result {
  const kv = parseCalcKV(input);
  const w = kvNum(kv, "weight", "w");
  const exerciseMin = kvNum(kv, "exercise", "workout") ?? 0;
  if (w === undefined) {
    return { output: "", error: "weight=70 (kg)\nexercise=30 (optional minutes/day)" };
  }
  let ml = w * 35;
  ml += (exerciseMin / 30) * 250;
  return [
    `Estimated fluids: ~${Math.round(ml)} ml (~${(ml / 1000).toFixed(1)} L/day)`,
    `(rule-of-thumb from weight${exerciseMin ? ` + ${exerciseMin} min activity` : ""})`,
    "",
    "Rough guideline — not medical advice.",
  ].join("\n");
}

export function calcBodyFatEstimate(input: string): Result {
  const kv = parseCalcKV(input);
  const w = kvNum(kv, "weight");
  const hCm = kvNum(kv, "height");
  const age = kvNum(kv, "age");
  const female = /^f/i.test(kv.sex || kv.gender || "m");
  if (w === undefined || hCm === undefined || age === undefined) {
    return {
      output: "",
      error: "weight=70 (kg)\nheight=175 (cm)\nage=30\nsex=m\n(Deurenberg formula from BMI)",
    };
  }
  const hm = hCm / 100;
  const bmi = w / (hm * hm);
  const s = female ? 0 : 1;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * s - 5.4;
  return [
    `BMI:              ${bmi.toFixed(1)}`,
    `Body fat (est.): ${bf.toFixed(1)}%`,
    "(Deurenberg et al. approximation — not diagnostic)",
  ].join("\n");
}

export function calcDaysBetween(input: string): Result {
  const kv = parseCalcKV(input);
  let d1 = kv.from || kv.start || kv.a;
  let d2 = kv.to || kv.end || kv.b;
  if (!d1 || !d2) {
    const iso = input.match(/\d{4}-\d{2}-\d{2}/g);
    if (iso && iso.length >= 2) {
      d1 = iso[0];
      d2 = iso[1];
    }
  }
  if (!d1 || !d2) {
    return {
      output: "",
      error: "from=2024-06-01\nto=2025-01-15\n(or paste two YYYY-MM-DD dates)",
    };
  }
  const a = new Date(`${d1}T12:00:00`);
  const b = new Date(`${d2}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return { output: "", error: "Could not parse dates — use YYYY-MM-DD" };
  }
  const days = Math.round(Math.abs(b.getTime() - a.getTime()) / 86400000);
  return [`A: ${d1}`, `B: ${d2}`, `Difference: ${days} calendar day(s)`].join("\n");
}

export function calcCountdown(input: string): Result {
  const kv = parseCalcKV(input);
  const targetRaw =
    kv.target || kv.date || kv.to || input.trim().split("\n").filter(Boolean)[0];
  if (!targetRaw) {
    return { output: "", error: "target=2026-12-31\n(or ISO date on first line)" };
  }
  const hasTime = /T\d/.test(targetRaw);
  const target = new Date(hasTime ? targetRaw : `${targetRaw}T23:59:59`);
  if (Number.isNaN(target.getTime())) return { output: "", error: "Invalid target date" };
  const now = Date.now();
  const ms = target.getTime() - now;
  if (ms <= 0) return [`Target ${targetRaw} is in the past.`].join("\n");
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hrs = Math.floor((sec % 86400) / 3600);
  const min = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [
    `Target: ${target.toLocaleString()}`,
    `Remaining: ${days}d ${hrs}h ${min}m ${s}s`,
    `(${sec.toLocaleString()} seconds)`,
  ].join("\n");
}

export function isoWeekMetadata(d: Date): { week: number; isoYear: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, isoYear };
}

export function calcWeekNumber(input: string): Result {
  const kv = parseCalcKV(input);
  const raw = kv.date || kv.d || input.trim().split("\n")[0];
  if (!raw) return { output: "", error: "date=2026-05-04\n(or YYYY-MM-DD on first line)" };
  const d = new Date(`${raw.trim()}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { output: "", error: "Invalid date" };
  const { week, isoYear } = isoWeekMetadata(d);
  return [
    `Date:      ${raw}`,
    `ISO week:  ${week}`,
    `ISO year:  ${isoYear}`,
    `Weekday:   ${d.toLocaleDateString(undefined, { weekday: "long" })}`,
  ].join("\n");
}

export function calcDueDateFromLmp(input: string): Result {
  const kv = parseCalcKV(input);
  const lmp = kv.lmp || kv.date || input.trim().split("\n")[0];
  if (!lmp) return { output: "", error: "lmp=2026-01-15\n(Naegele rule: +280 days)" };
  const start = new Date(`${lmp}T12:00:00`);
  if (Number.isNaN(start.getTime())) return { output: "", error: "Invalid LMP date (YYYY-MM-DD)" };
  const due = new Date(start);
  due.setDate(due.getDate() + 280);
  return [
    `LMP:           ${lmp}`,
    `EDD (~40 wk): ${due.toISOString().slice(0, 10)}`,
    "",
    "Estimate only — always follow clinical guidance.",
  ].join("\n");
}

export function solveQuadraticEquation(input: string): Result {
  const kv = parseCalcKV(input);
  let a = kvNum(kv, "a");
  let b = kvNum(kv, "b");
  let c = kvNum(kv, "c");
  if (a === undefined || b === undefined || c === undefined) {
    return { output: "", error: "a=1\nb=-5\nc=6   → roots of ax²+bx+c=0" };
  }
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return { output: "", error: "Not a valid equation (a and b both ~0)" };
    const x = -c / b;
    return [`Linear: ${b}x + ${c} = 0`, `x = ${x}`].join("\n");
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) {
    const real = -b / (2 * a);
    const imag = Math.sqrt(-disc) / (2 * a);
    return [
      `Discriminant: ${disc.toFixed(6)} (complex roots)`,
      `x₁ = ${real.toFixed(6)} + ${imag.toFixed(6)}i`,
      `x₂ = ${real.toFixed(6)} - ${imag.toFixed(6)}i`,
    ].join("\n");
  }
  const s = Math.sqrt(disc);
  const x1 = (-b + s) / (2 * a);
  const x2 = (-b - s) / (2 * a);
  return [
    `Equation: (${a})x² + (${b})x + (${c}) = 0`,
    `Discriminant: ${disc}`,
    disc === 0 ? `Double root: x = ${x1}` : `x₁ = ${x1}\nx₂ = ${x2}`,
  ].join("\n");
}

export function solvePythagorean(input: string): Result {
  const kv = parseCalcKV(input);
  let a = kvNum(kv, "a");
  let b = kvNum(kv, "b");
  let c = kvNum(kv, "c");
  const count = [a, b, c].filter((x) => x !== undefined).length;
  if (count !== 2) {
    return {
      output: "",
      error: "Provide exactly two sides (cm/units):\na=3\nb=4\n(leaves c blank)\nor a=3 c=5 (find b)",
    };
  }
  const sq = (x: number) => x * x;
  if (c === undefined && a !== undefined && b !== undefined) {
    const h = Math.sqrt(sq(a) + sq(b));
    return [`Legs a=${a}, b=${b}`, `Hypotenuse c = ${h.toFixed(6)}`].join("\n");
  }
  if (a === undefined && b !== undefined && c !== undefined) {
    if (c <= b) return { output: "", error: "Hypotenuse must be greater than leg b" };
    const leg = Math.sqrt(sq(c) - sq(b));
    return [`Leg b=${b}, hypotenuse c=${c}`, `Other leg a = ${leg.toFixed(6)}`].join("\n");
  }
  if (b === undefined && a !== undefined && c !== undefined) {
    if (c <= a) return { output: "", error: "Hypotenuse must be greater than leg a" };
    const leg = Math.sqrt(sq(c) - sq(a));
    return [`Leg a=${a}, hypotenuse c=${c}`, `Other leg b = ${leg.toFixed(6)}`].join("\n");
  }
  return { output: "", error: "Specify exactly one unknown among a, b, c" };
}

export function calcGcdLcmPair(input: string): Result {
  const kv = parseCalcKV(input);
  let x = kvNum(kv, "a", "x", "m");
  let y = kvNum(kv, "b", "y", "n");
  if (x === undefined || y === undefined) {
    const nums = input
      .trim()
      .split(/[\s,]+/)
      .map((s) => parseFloat(s))
      .filter((n) => Number.isFinite(n));
    if (nums.length >= 2) {
      x = nums[0];
      y = nums[1];
    }
  }
  if (x === undefined || y === undefined) {
    return { output: "", error: "a=12\nb=18\n(or two integers on one line)" };
  }
  const g = gcdTwo(x, y);
  const l = Math.abs(Math.round(x) * Math.round(y)) / g;
  return [`GCD(${x}, ${y}) = ${g}`, `LCM(${x}, ${y}) = ${l}`].join("\n");
}

// ============================================================
// JSON CONVERSION
// ============================================================

export function jsonToYaml(input: string): Result {
  try {
    const obj = JSON.parse(input);
    return yaml.dump(obj, { indent: 2, lineWidth: 120 });
  } catch (e) {
    return { output: "", error: `Invalid JSON: ${(e as Error).message}` };
  }
}

export function yamlToJson(input: string): Result {
  try {
    const obj = yaml.load(input);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return { output: "", error: `Invalid YAML: ${(e as Error).message}` };
  }
}

export function jsonToCsv(input: string): Result {
  try {
    const data = JSON.parse(input);
    if (!Array.isArray(data)) return { output: "", error: "JSON must be an array of objects" };
    if (!data.length) return "";
    const headers = [...new Set(data.flatMap((item: Record<string, unknown>) => Object.keys(item)))];
    const csvLines = [
      headers.map((h) => `"${h}"`).join(","),
      ...data.map((item: Record<string, unknown>) =>
        headers.map((h) => {
          const val = item[h];
          if (val === null || val === undefined) return "";
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    return csvLines.join("\n");
  } catch (e) {
    return { output: "", error: `Invalid JSON: ${(e as Error).message}` };
  }
}

export function csvToJson(input: string): Result {
  try {
    const lines = input.trim().split("\n");
    if (lines.length < 2) return { output: "", error: "CSV must have a header row and at least one data row" };
    const headers = parseCsvLine(lines[0]);
    const data = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return { output: "", error: `CSV parse error: ${(e as Error).message}` };
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { result.push(current); current = ""; }
      else current += c;
    }
  }
  result.push(current);
  return result;
}

export function jsonToTypescript(input: string): Result {
  try {
    const data = JSON.parse(input);
    return generateInterface("Root", data);
  } catch (e) {
    return { output: "", error: `Invalid JSON: ${(e as Error).message}` };
  }
}

function generateInterface(name: string, obj: unknown, depth = 0): string {
  if (obj === null || typeof obj !== "object") {
    return `type ${name} = ${tsType(obj)};\n`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `type ${name} = unknown[];\n`;
    const item = obj[0];
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      return generateInterface(`${name}Item`, item, depth) + `\ntype ${name} = ${name}Item[];\n`;
    }
    return `type ${name} = ${tsType(item)}[];\n`;
  }
  const lines: string[] = [`interface ${name} {`];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const safeName = /^[a-zA-Z_$][\w$]*$/.test(key) ? key : `"${key}"`;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const typeName = capitalize(key);
      lines.push(`  ${safeName}: ${typeName};`);
      nested.push(generateInterface(typeName, value, depth + 1));
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      const typeName = capitalize(key) + "Item";
      lines.push(`  ${safeName}: ${typeName}[];`);
      nested.push(generateInterface(typeName, value[0], depth + 1));
    } else {
      lines.push(`  ${safeName}: ${tsType(value)};`);
    }
  }
  lines.push("}");
  return [...nested, lines.join("\n")].join("\n\n");
}

function tsType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    return `${tsType(value[0])}[]`;
  }
  switch (typeof value) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    default: return "unknown";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}

export function jsonToXml(input: string): Result {
  try {
    const data = JSON.parse(input);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(data, "root");
  } catch (e) {
    return { output: "", error: `Invalid JSON: ${(e as Error).message}` };
  }
}

function toXml(obj: unknown, tag: string): string {
  if (obj === null || obj === undefined) return `<${tag}/>`;
  if (Array.isArray(obj)) return obj.map((item) => toXml(item, "item")).join("\n");
  if (typeof obj === "object") {
    const inner = Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => toXml(v, k))
      .join("\n");
    return `<${tag}>\n${inner.split("\n").map((l) => "  " + l).join("\n")}\n</${tag}>`;
  }
  const escaped = String(obj).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<${tag}>${escaped}</${tag}>`;
}

export function xmlToJson(input: string): Result {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, "text/xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) return { output: "", error: "Invalid XML: " + errorNode.textContent };
    return JSON.stringify(xmlNodeToObj(doc.documentElement), null, 2);
  } catch (e) {
    return { output: "", error: `XML parse error: ${(e as Error).message}` };
  }
}

function xmlNodeToObj(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  if (node.attributes.length) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj[`@${attr.name}`] = attr.value;
    }
  }
  const children = Array.from(node.childNodes);
  const textContent = children
    .filter((c) => c.nodeType === 3)
    .map((c) => c.textContent?.trim())
    .filter(Boolean)
    .join("");

  if (!node.children.length && textContent) {
    if (!node.attributes.length) return textContent;
    obj["#text"] = textContent;
    return obj;
  }

  const childMap: Record<string, unknown[]> = {};
  for (const child of Array.from(node.children)) {
    const key = child.tagName;
    if (!childMap[key]) childMap[key] = [];
    childMap[key].push(xmlNodeToObj(child));
  }

  for (const [key, values] of Object.entries(childMap)) {
    obj[key] = values.length === 1 ? values[0] : values;
  }

  return obj;
}

function escapeXmlTextChunk(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttrValue(s: string): string {
  return escapeXmlTextChunk(s).replace(/"/g, "&quot;");
}

function parseXmlDoc(input: string): { doc: Document; error?: string } {
  const doc = new DOMParser().parseFromString(input, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    return {
      doc,
      error: errorNode.textContent?.trim() || "Malformed XML",
    };
  }
  return { doc };
}

/** Well-formedness check for the XML Tools Suite. */
export function xmlSuiteValidate(input: string): Result {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: "Paste XML to validate" };
  const { error } = parseXmlDoc(trimmed);
  if (error) return { output: "", error };
  return {
    output:
      "Document is well-formed.\n\nTip: validation uses the browser XML parser (same engine as XML → JSON).",
  };
}

function serializeXmlPretty(el: Element, depth: number): string {
  const pad = "  ".repeat(depth);
  const name = el.tagName;
  const attrs = [...el.attributes]
    .map((a) => ` ${a.name}="${escapeXmlAttrValue(a.value)}"`)
    .join("");
  const rawChildren = [...el.childNodes];
  const meaningful = rawChildren.filter((ch) => {
    if (ch.nodeType === Node.TEXT_NODE) {
      return Boolean((ch.textContent ?? "").trim());
    }
    return (
      ch.nodeType === Node.ELEMENT_NODE ||
      ch.nodeType === Node.COMMENT_NODE ||
      ch.nodeType === Node.CDATA_SECTION_NODE
    );
  });

  if (meaningful.length === 0) return `${pad}<${name}${attrs}/>`;

  if (
    meaningful.length === 1 &&
    meaningful[0].nodeType === Node.TEXT_NODE
  ) {
    const t = meaningful[0].textContent ?? "";
    return `${pad}<${name}${attrs}>${escapeXmlTextChunk(t)}</${name}>`;
  }

  const inner = meaningful
    .map((ch) => {
      if (ch.nodeType === Node.TEXT_NODE) {
        const t = (ch.textContent ?? "").trim();
        return t ? `${pad}  ${escapeXmlTextChunk(t)}` : "";
      }
      if (ch.nodeType === Node.ELEMENT_NODE) {
        return serializeXmlPretty(ch as Element, depth + 1);
      }
      if (ch.nodeType === Node.COMMENT_NODE) {
        return `${pad}  <!--${(ch as Comment).data}-->`;
      }
      if (ch.nodeType === Node.CDATA_SECTION_NODE) {
        return `${pad}  <![CDATA[${(ch as CDATASection).data}]]>`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  return `${pad}<${name}${attrs}>\n${inner}\n${pad}</${name}>`;
}

export function xmlSuitePrettyPrint(input: string): Result {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: "Paste XML to format" };
  const { doc, error } = parseXmlDoc(trimmed);
  if (error) return { output: "", error };
  const declMatch = trimmed.match(/^<\?xml[^?]*\?>\s*/);
  const decl = declMatch ? declMatch[0].trimEnd() : "";
  const body = serializeXmlPretty(doc.documentElement, 0);
  const out = decl ? `${decl}\n${body}` : body;
  return { output: out };
}

function minifyXmlElement(el: Element): string {
  const name = el.tagName;
  const attrs = [...el.attributes]
    .map((a) => ` ${a.name}="${escapeXmlAttrValue(a.value)}"`)
    .join("");
  let inner = "";
  for (const ch of el.childNodes) {
    if (ch.nodeType === Node.TEXT_NODE) {
      inner += escapeXmlTextChunk(ch.textContent ?? "");
    } else if (ch.nodeType === Node.ELEMENT_NODE) {
      inner += minifyXmlElement(ch as Element);
    } else if (ch.nodeType === Node.CDATA_SECTION_NODE) {
      inner += `<![CDATA[${(ch as CDATASection).data}]]>`;
    } else if (ch.nodeType === Node.COMMENT_NODE) {
      inner += `<!--${(ch as Comment).data}-->`;
    }
  }
  if (!inner) return `<${name}${attrs}/>`;
  return `<${name}${attrs}>${inner}</${name}>`;
}

export function xmlSuiteMinify(input: string): Result {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: "Paste XML to minify" };
  const { doc, error } = parseXmlDoc(trimmed);
  if (error) return { output: "", error };
  const declMatch = trimmed.match(/^<\?xml[^?]*\?>/);
  const decl = declMatch ? declMatch[0] : "";
  const body = minifyXmlElement(doc.documentElement);
  const out = decl ? `${decl}${body}` : body;
  return { output: out };
}

export function xmlSuiteXPath(input: string, xpathExpr: string): Result {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: "Paste XML first" };
  const expr = xpathExpr.trim();
  if (!expr) return { output: "", error: "Enter an XPath expression" };
  const { doc, error } = parseXmlDoc(trimmed);
  if (error) return { output: "", error };
  try {
    const snapshot = doc.evaluate(
      expr,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    const lines: string[] = [];
    const max = Math.min(snapshot.snapshotLength, 500);
    for (let i = 0; i < max; i++) {
      const node = snapshot.snapshotItem(i);
      if (!node) continue;
      if (node.nodeType === Node.ELEMENT_NODE) {
        lines.push((node as Element).outerHTML);
      } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
        lines.push(`${(node as Attr).name}="${(node as Attr).value}"`);
      } else {
        lines.push(node.textContent ?? "");
      }
    }
    if (snapshot.snapshotLength > 500) {
      lines.push(`… truncated (${snapshot.snapshotLength} total matches, showing 500)`);
    }
    return {
      output:
        lines.length > 0 ? lines.join("\n---\n") : "(no matches for this XPath)",
    };
  } catch (e) {
    return { output: "", error: `XPath error: ${(e as Error).message}` };
  }
}

export function xmlSuiteSearch(input: string, needle: string): Result {
  const n = needle.trim();
  if (!input.trim()) return { output: "", error: "Paste XML to search" };
  if (!n) return { output: "", error: "Enter text to find" };
  const lines = input.split(/\n/);
  const hits: string[] = [];
  lines.forEach((line, i) => {
    if (line.includes(n)) {
      const preview = line.trim().slice(0, 240);
      hits.push(`${i + 1}: ${preview}${line.trim().length > 240 ? "…" : ""}`);
    }
  });
  return {
    output:
      hits.length > 0
        ? `${hits.length} line(s) containing "${n}":\n\n${hits.join("\n")}`
        : `No lines contain "${n}".`,
  };
}

export function tomlToJson(input: string): Result {
  try {
    const result: Record<string, unknown> = {};
    let currentTable = result;
    const lines = input.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.replace(/#.*$/, "").trim();
      if (!line) continue;

      const tableMatch = line.match(/^\[([^\]]+)\]$/);
      if (tableMatch) {
        const path = tableMatch[1].split(".");
        let obj = result;
        for (const key of path) {
          if (!obj[key]) obj[key] = {};
          obj = obj[key] as Record<string, unknown>;
        }
        currentTable = obj;
        continue;
      }

      const kvMatch = line.match(/^([^=]+)=(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim().replace(/^["']|["']$/g, "");
        const val = kvMatch[2].trim();
        currentTable[key] = parseTomlValue(val);
      }
    }

    return JSON.stringify(result, null, 2);
  } catch (e) {
    return { output: "", error: `TOML parse error: ${(e as Error).message}` };
  }
}

// ── AES-256-GCM Encrypt/Decrypt ─────────────────────────────────────────

export async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const subtle = requireSubtleCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function aesDecrypt(ciphertext: string, password: string): Promise<string> {
  const subtle = requireSubtleCrypto();
  const enc = new TextEncoder();
  const raw = Uint8Array.from(atob(ciphertext.trim()), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const data = raw.slice(28);
  const keyMaterial = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const decrypted = await subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function parseTomlValue(val: string): unknown {
  if (val === "true") return true;
  if (val === "false") return false;
  if (/^-?\d+$/.test(val)) return parseInt(val);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  if (/^".*"$/.test(val) || /^'.*'$/.test(val)) return val.slice(1, -1);
  if (val.startsWith("[")) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}
