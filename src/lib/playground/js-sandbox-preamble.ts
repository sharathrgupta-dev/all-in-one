/** Split stdin into lines (trailing empty line still yields readable "" for one extra read if needed). */
export function stdinLinesFromText(stdin: string): string[] {
  return stdin.replace(/\r\n/g, "\n").split("\n");
}

/**
 * Prepends helpers so user code can read stdin without changing the iframe runner.
 * - `readStdinLine()` returns next line or `null` at EOF (like buffered line reader).
 * - `nodeShim`: minimal `process` + `require("readline")` compatible with common Node samples.
 */
export function buildJsSandboxPreamble(stdin: string, nodeShim: boolean): string {
  const lines = stdinLinesFromText(stdin);
  const json = JSON.stringify(lines);

  let head = `const __STDIN_LINES = ${json};
let __STDIN_I = 0;
function readStdinLine() {
  if (__STDIN_I >= __STDIN_LINES.length) return null;
  return __STDIN_LINES[__STDIN_I++];
}
`;

  if (nodeShim) {
    head += `var process = {
  stdin: {},
  stdout: {
    write: function (x) {
      console.log(String(x).replace(/\\n$/, ""));
    },
  },
  stderr: { write: function (x) { console.error(String(x).replace(/\\n$/, "")); } },
  env: {},
  version: "v22-playground",
};
function require(name) {
  if (name === "readline") {
    return {
      createInterface: function () {
        return {
          on: function (ev, fn) {
            if (ev !== "line") return;
            var ln;
            while ((ln = readStdinLine()) !== null) fn(ln);
          },
          terminal: false,
        };
      },
    };
  }
  throw new Error("require('" + name + "') is not available in this browser sandbox.");
};
`;
  }

  return head;
}
