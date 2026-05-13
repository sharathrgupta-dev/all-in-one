/**
 * Transpile TypeScript to JavaScript in the browser (async chunk).
 */
export async function transpileTsToJs(source: string): Promise<{ js: string } | { errors: string }> {
  const ts = await import("typescript");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      isolatedModules: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    reportDiagnostics: true,
  });
  const diags = out.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error) ?? [];
  if (diags.length) {
    const msg = diags
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      .join("\n");
    return { errors: msg };
  }
  return { js: out.outputText };
}
