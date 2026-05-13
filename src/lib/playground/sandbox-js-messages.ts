import { SANDBOX_MESSAGE_SOURCE } from "@/lib/playground/constants";

export type SandboxChildMessage =
  | { source: typeof SANDBOX_MESSAGE_SOURCE; type: "READY" }
  | { source: typeof SANDBOX_MESSAGE_SOURCE; type: "LOG"; id: number; level: string; args: string[] }
  | { source: typeof SANDBOX_MESSAGE_SOURCE; type: "DONE"; id: number }
  | { source: typeof SANDBOX_MESSAGE_SOURCE; type: "ERROR"; id: number; message: string; stack: string }
  | { source: typeof SANDBOX_MESSAGE_SOURCE; type: "UNCAUGHT"; id: number; message: string; stack: string };

export function isSandboxChildMessage(data: unknown): data is SandboxChildMessage {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return o.source === SANDBOX_MESSAGE_SOURCE && typeof o.type === "string";
}
