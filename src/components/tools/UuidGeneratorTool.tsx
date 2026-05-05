"use client";

import { useState, useCallback } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";
import * as engines from "@/lib/tool-engines";

type IdType = "uuid" | "ulid" | "nanoid";

const TYPE_INFO = {
  uuid: {
    label: "UUID v4",
    desc: "128-bit random. RFC 4122 standard. Universally supported.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  ulid: {
    label: "ULID",
    desc: "Lexicographically sortable. Timestamp-prefixed. URL-safe Base32.",
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  },
  nanoid: {
    label: "Nano ID",
    desc: "Compact, URL-safe, customizable length. Smaller than UUID.",
    example: "V1StGXR8_Z5jdHi6B-myT",
  },
};

export default function UuidGeneratorTool({ tool }: { tool: Tool }) {
  const [idType, setIdType] = useState<IdType>("uuid");
  const [count, setCount] = useState(5);
  const [nanoSize, setNanoSize] = useState(21);
  const [ids, setIds] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generate = useCallback(() => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      if (idType === "uuid") result.push(engines.generateUuids(1)[0]);
      else if (idType === "ulid") result.push(engines.generateUlid());
      else result.push(engines.generateNanoId(nanoSize));
    }
    setIds(result);
  }, [idType, count, nanoSize]);

  const copyOne = (id: string, idx: number) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(ids.join("\n")).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 p-5 rounded-xl border border-border bg-card">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              ID Type
            </label>
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="uuid">UUID v4</option>
              <option value="ulid">ULID</option>
              <option value="nanoid">Nano ID</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Count
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={count}
              onChange={(e) =>
                setCount(Math.min(25, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="w-20 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          {idType === "nanoid" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Length
              </label>
              <input
                type="number"
                min={4}
                max={64}
                value={nanoSize}
                onChange={(e) =>
                  setNanoSize(Math.min(64, Math.max(4, parseInt(e.target.value) || 21)))
                }
                className="w-20 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={generate}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Results */}
        {ids.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                {ids.length} {TYPE_INFO[idType].label} IDs
              </span>
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAll ? "Copied all!" : "Copy all"}
              </button>
            </div>
            <div className="divide-y divide-border">
              {ids.map((id, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 font-mono text-sm gap-3"
                >
                  <span className="break-all">{id}</span>
                  <button
                    onClick={() => copyOne(id, idx)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ids.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Click <strong className="text-foreground">Generate</strong> to create IDs
          </div>
        )}

        {/* Type info cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(TYPE_INFO) as [IdType, (typeof TYPE_INFO)[IdType]][]).map(
            ([type, info]) => (
              <button
                key={type}
                onClick={() => setIdType(type)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  idType === type
                    ? "border-accent/60 bg-accent/5"
                    : "border-border bg-card hover:border-accent/30"
                }`}
              >
                <p className="text-sm font-semibold">{info.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
                <p className="text-xs font-mono text-muted-foreground/70 mt-2 truncate">
                  e.g. {info.example}
                </p>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
