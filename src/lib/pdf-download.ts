/** Browser-safe download helpers for PDF toolkit tools. */

import { trackToolDownload } from "@/lib/analytics-events";

export function downloadUint8(
  bytes: Uint8Array,
  filename: string,
  mimeType = "application/pdf",
  tool?: string,
): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: mimeType });
  downloadBlob(blob, filename, tool);
}

export function downloadBlob(
  blob: Blob,
  filename: string,
  tool?: string,
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  if (tool) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
    trackToolDownload(tool, ext);
  }
}
