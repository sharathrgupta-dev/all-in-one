export type NotebookCell = {
  id: string;
  cellType: "code" | "markdown" | "raw";
  source: string;
};

function cellSource(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.join("");
  return "";
}

/** Minimal nbformat v4 reader: code + markdown + raw cells only. */
export function parseIpynbJson(text: string): { title: string; cells: NotebookCell[] } {
  const root = JSON.parse(text) as {
    metadata?: { title?: string };
    cells?: Array<{ cell_type?: string; source?: unknown }>;
  };
  const title =
    typeof root.metadata?.title === "string" && root.metadata.title.trim()
      ? root.metadata.title.trim()
      : "Notebook";
  const rawCells = Array.isArray(root.cells) ? root.cells : [];
  const cells: NotebookCell[] = [];
  let i = 0;
  for (const c of rawCells) {
    const t = c.cell_type;
    if (t !== "code" && t !== "markdown" && t !== "raw") continue;
    cells.push({
      id: `c-${i++}`,
      cellType: t,
      source: cellSource(c.source),
    });
  }
  return { title, cells };
}
