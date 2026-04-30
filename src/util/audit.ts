import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../config.js";

export interface AuditEntry {
  ts: string;
  tool: string;
  args: Record<string, unknown>;
  durationMs: number;
  ok: boolean;
  error?: string;
}

export function writeAuditEntry(entry: AuditEntry): void {
  try {
    const logPath = path.join(getConfig().outputDir, "audit.log");
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // never let audit logging break tool execution
  }
}
