import fs from "node:fs";
import type { Dispatcher } from "undici";
import type { Config } from "../config.js";
import { outputPath } from "../util/paths.js";

export function spillJsonIfLarge(
  data: unknown,
  toolName: string,
  cfg: Config
): JsonResult | SpillResult {
  const json = JSON.stringify(data, null, 2);
  if (json.length > cfg.spillThresholdBytes) {
    const filePath = outputPath(toolName, "json");
    fs.writeFileSync(filePath, json, "utf-8");
    return { type: "spill", filePath, bytes: json.length, preview: json.slice(0, 1024) };
  }
  return { type: "json", data };
}

export interface SpillResult {
  type: "spill";
  filePath: string;
  bytes: number;
  preview: string;
}

export interface JsonResult {
  type: "json";
  data: unknown;
}

export async function spillIfLarge(
  body: Dispatcher.ResponseData["body"],
  toolName: string,
  cfg: Config
): Promise<JsonResult | SpillResult> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  let spilled = false;
  let filePath = "";
  let outStream: fs.WriteStream | null = null;

  for await (const chunk of body) {
    const buf = chunk instanceof Buffer ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;

    if (!spilled && totalBytes > cfg.spillThresholdBytes) {
      spilled = true;
      filePath = outputPath(toolName, "json");
      outStream = fs.createWriteStream(filePath);
      for (const prev of chunks) outStream.write(prev);
      chunks.length = 0;
    }

    if (spilled) {
      outStream!.write(buf);
    } else {
      chunks.push(buf);
    }
  }

  if (spilled) {
    await new Promise<void>((resolve, reject) =>
      outStream!.end((err: Error | null) => (err ? reject(err) : resolve()))
    );
    const raw = fs.readFileSync(filePath);
    const preview = raw.slice(0, 1024).toString("utf-8");
    return { type: "spill", filePath, bytes: totalBytes, preview };
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  return { type: "json", data: JSON.parse(raw) };
}
