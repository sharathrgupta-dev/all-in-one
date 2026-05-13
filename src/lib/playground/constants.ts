/** Pin to the installed `monaco-editor` version (see package.json). */
export const PLAYGROUND_MONACO_VERSION = "0.55.1" as const;

export const PLAYGROUND_MONACO_VS_CDN = `https://cdn.jsdelivr.net/npm/monaco-editor@${PLAYGROUND_MONACO_VERSION}/min/vs`;

/** Must match the installed `pyodide` npm version for `checkAPIVersion`. */
export const PLAYGROUND_PYODIDE_VERSION = "0.29.4";

export const PLAYGROUND_PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PLAYGROUND_PYODIDE_VERSION}/full/`;

export const SANDBOX_MESSAGE_SOURCE = "devbench-sandbox" as const;
