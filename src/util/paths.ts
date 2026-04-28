import { getConfig } from "../config.js";

export function outputPath(toolName: string, ext: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const safe = toolName.replace(/[^a-z0-9_-]/gi, "_");
  return `${getConfig().outputDir}/${safe}-${ts}.${ext}`;
}
