import fs from "node:fs";
import crypto from "node:crypto";
import type { Readable } from "node:stream";
import type { Dispatcher } from "undici";

export interface StreamResult {
  filePath: string;
  bytes: number;
  sha256: string;
  contentType: string;
}

export async function streamToFile(
  body: Dispatcher.ResponseData["body"],
  filePath: string,
  contentType: string
): Promise<StreamResult> {
  const out = fs.createWriteStream(filePath);
  const hash = crypto.createHash("sha256");
  let bytes = 0;

  // undici BodyReadable extends Node.js Readable
  const nodeStream = body as unknown as Readable;

  await new Promise<void>((resolve, reject) => {
    nodeStream.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      hash.update(chunk);
    });
    nodeStream.on("error", reject);
    nodeStream.pipe(out).on("finish", resolve).on("error", reject);
  });

  return { filePath, bytes, sha256: hash.digest("hex"), contentType };
}
