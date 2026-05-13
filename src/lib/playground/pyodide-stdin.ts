import type { PyodideInterface } from "pyodide";
import { stdinLinesFromText } from "@/lib/playground/js-sandbox-preamble";

/** Feed `sys.stdin` line-by-line (OneCompiler-style stdin box). */
export function installPyodideStdin(py: PyodideInterface, stdinText: string): void {
  const lines = stdinLinesFromText(stdinText);
  let i = 0;
  py.setStdin({
    stdin: () => {
      if (i >= lines.length) return null;
      return lines[i++] + "\n";
    },
  });
}
