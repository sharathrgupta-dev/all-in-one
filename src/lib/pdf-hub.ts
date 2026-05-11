import { getToolBySlug, type Tool } from "@/lib/tools-registry";

/** Hub display order — matches registry PDF block: organize → optimize → convert → review */
export const PDF_HUB_ORDER = [
  "merge-pdf",
  "split-pdf",
  "image-to-pdf",
  "organize-pdf",
  "rotate-pdf",
  "pdf-page-numbers",
  "pdf-page-editor",
  "compress-pdf",
  "watermark-pdf",
  "text-to-pdf",
  "html-to-pdf",
  "ipynb-to-pdf",
  "pdf-to-jpg",
  "pdf-compare",
] as const;

export type PdfHubFilter =
  | "all"
  | "organize"
  | "optimize"
  | "convert"
  | "review";

const ORGANIZE_SLUGS = new Set<string>([
  "merge-pdf",
  "split-pdf",
  "organize-pdf",
  "rotate-pdf",
  "pdf-page-numbers",
  "pdf-page-editor",
]);

const OPTIMIZE_SLUGS = new Set<string>(["compress-pdf"]);

const CONVERT_SLUGS = new Set<string>([
  "image-to-pdf",
  "text-to-pdf",
  "html-to-pdf",
  "ipynb-to-pdf",
  "pdf-to-jpg",
]);

const REVIEW_SLUGS = new Set<string>(["watermark-pdf", "pdf-compare"]);

export function getPdfHubTools(): Tool[] {
  return PDF_HUB_ORDER.map((slug) => getToolBySlug(slug)).filter(
    (t): t is Tool => Boolean(t)
  );
}

export function pdfHubFilterForSlug(
  slug: string
): Exclude<PdfHubFilter, "all"> | null {
  if (ORGANIZE_SLUGS.has(slug)) return "organize";
  if (OPTIMIZE_SLUGS.has(slug)) return "optimize";
  if (CONVERT_SLUGS.has(slug)) return "convert";
  if (REVIEW_SLUGS.has(slug)) return "review";
  return null;
}
