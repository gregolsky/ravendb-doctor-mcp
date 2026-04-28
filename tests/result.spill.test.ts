import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Readable } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resetConfig } from "../src/config.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "raven-mcp-test-"));
  process.env.RAVEN_NODE_URLS = "http://localhost:8080";
  process.env.RAVEN_OUTPUT_DIR = tmpDir;
  delete process.env.RAVEN_CERT_PFX;
  resetConfig();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.RAVEN_NODE_URLS;
  delete process.env.RAVEN_OUTPUT_DIR;
  resetConfig();
});

async function bodyFromString(s: string) {
  const readable = Readable.from([Buffer.from(s)]);
  return readable;
}

describe("spillIfLarge", () => {
  it("returns inline JSON when under threshold", async () => {
    const { spillIfLarge } = await import("../src/tools/result.js");
    const { getConfig } = await import("../src/config.js");
    const cfg = getConfig();

    const smallJson = JSON.stringify({ ok: true });
    const body = await bodyFromString(smallJson);
    const result = await spillIfLarge(body as never, "test_tool", "application/json", cfg);

    expect(result.type).toBe("json");
    if (result.type === "json") {
      expect(result.data).toEqual({ ok: true });
    }
  });

  it("spills to disk when over threshold", async () => {
    process.env.RAVEN_SPILL_THRESHOLD_BYTES = "50";
    resetConfig();

    const { spillIfLarge } = await import("../src/tools/result.js");
    const { getConfig } = await import("../src/config.js");
    const cfg = getConfig();

    const bigJson = JSON.stringify({ data: "x".repeat(200) });
    const body = await bodyFromString(bigJson);
    const result = await spillIfLarge(body as never, "test_tool", "application/json", cfg);

    expect(result.type).toBe("spill");
    if (result.type === "spill") {
      expect(fs.existsSync(result.filePath)).toBe(true);
      expect(result.bytes).toBeGreaterThan(50);
      expect(result.preview.length).toBeGreaterThan(0);
    }
    delete process.env.RAVEN_SPILL_THRESHOLD_BYTES;
  });
});
