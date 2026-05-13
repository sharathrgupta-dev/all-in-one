import type { PyodideInterface } from "pyodide";
import { PLAYGROUND_PYODIDE_INDEX_URL } from "@/lib/playground/constants";

export type PyodideHandle = PyodideInterface;

let pyodidePromise: Promise<PyodideHandle> | null = null;

/** Single shared interpreter; first call downloads WASM (~10–20 MB from jsDelivr). */
export function ensurePyodide(): Promise<PyodideHandle> {
  if (!pyodidePromise) {
    pyodidePromise = import("pyodide").then(({ loadPyodide }) =>
      loadPyodide({
        indexURL: PLAYGROUND_PYODIDE_INDEX_URL,
        fullStdLib: false,
      }),
    );
  }
  return pyodidePromise;
}
