"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Copy, Check, ImageIcon } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

const CHECKERBOARD =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='%23e2e8f0'/%3E%3Crect width='8' height='8' fill='%23cbd5e1'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23cbd5e1'/%3E%3C/svg%3E";

function CopyBtn({
  text,
  id,
  label,
  copied,
  onCopy,
}: {
  text: string;
  id: string;
  label: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <button
      onClick={() => onCopy(text, id)}
      disabled={!text}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
    >
      {copied === id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied === id ? "Copied!" : label}
    </button>
  );
}

export default function Base64ImageTool({ tool }: { tool: Tool }) {
  const [tab, setTab] = useState<"encode" | "decode">("encode");

  // Encode state
  const [dataUri, setDataUri] = useState("");
  const [rawBase64, setRawBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  // Decode state
  const [decodeInput, setDecodeInput] = useState("");
  const [decodePreview, setDecodePreview] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const b64 = result.split(",")[1] ?? "";
      setDataUri(result);
      setRawBase64(b64);
      setFileName(file.name);
      setFileSize(file.size);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const handleDecode = useCallback(() => {
    setDecodeError("");
    setDecodePreview("");
    const raw = decodeInput.trim();
    if (!raw) return;
    if (raw.startsWith("data:image/")) {
      setDecodePreview(raw);
      return;
    }
    const clean = raw.replace(/\s/g, "");
    let mime = "image/png";
    if (clean.startsWith("/9j/")) mime = "image/jpeg";
    else if (clean.startsWith("R0lG")) mime = "image/gif";
    else if (clean.startsWith("UklG")) mime = "image/webp";
    else if (clean.startsWith("PHN2")) mime = "image/svg+xml";
    setDecodePreview(`data:${mime};base64,${clean}`);
  }, [decodeInput]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const fmtSize = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium w-fit mb-6">
          {(["encode", "decode"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 transition-colors ${
                tab === t
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "encode" ? "Image → Base64" : "Base64 → Image"}
            </button>
          ))}
        </div>

        {tab === "encode" && (
          <div className="space-y-5">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                dragging
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40 bg-card"
              }`}
            >
              <div className="p-3 rounded-full bg-accent/10">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-medium">
                  {fileName ? fileName : "Drop an image or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fileSize ? fmtSize(fileSize) : "PNG, JPEG, GIF, WebP, SVG"}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {dataUri && (
              <>
                {/* Preview */}
                <div className="rounded-xl border border-border overflow-hidden">
                  <img
                    src={dataUri}
                    alt="Preview"
                    className="max-h-48 w-full object-contain"
                    style={{ background: `url(${CHECKERBOARD})` }}
                  />
                </div>

                {/* Output snippets */}
                <div className="space-y-3">
                  {[
                    { id: "datauri", label: "Data URI", text: dataUri },
                    { id: "raw", label: "Raw Base64", text: rawBase64 },
                    {
                      id: "css",
                      label: "CSS background-image",
                      text: `background-image: url('${dataUri}');`,
                    },
                    {
                      id: "html",
                      label: "HTML <img> tag",
                      text: `<img src="${dataUri}" alt="${fileName}" />`,
                    },
                  ].map(({ id, label, text }) => (
                    <div
                      key={id}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {text.length.toLocaleString()} chars
                          </span>
                          <CopyBtn
                            text={text}
                            id={id}
                            label="Copy"
                            copied={copied}
                            onCopy={copy}
                          />
                        </div>
                      </div>
                      <div className="p-3 font-mono text-xs break-all max-h-20 overflow-auto text-muted-foreground">
                        {text.slice(0, 300)}
                        {text.length > 300 && "…"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "decode" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste Base64 string or data URI
              </label>
              <textarea
                value={decodeInput}
                onChange={(e) => {
                  setDecodeInput(e.target.value);
                  setDecodePreview("");
                  setDecodeError("");
                }}
                rows={7}
                placeholder={`data:image/png;base64,iVBORw0KGgo…\n\nor paste a raw Base64 string`}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 resize-y"
              />
            </div>

            <button
              onClick={handleDecode}
              disabled={!decodeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Decode & Preview
            </button>

            {decodeError && (
              <p className="text-sm text-destructive">{decodeError}</p>
            )}

            {decodePreview && (
              <div className="rounded-xl border border-border overflow-hidden">
                <img
                  src={decodePreview}
                  alt="Decoded"
                  className="max-h-96 w-full object-contain"
                  style={{ background: `url(${CHECKERBOARD})` }}
                  onError={() => {
                    setDecodeError(
                      "Could not render image — check that the Base64 data is valid."
                    );
                    setDecodePreview("");
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
