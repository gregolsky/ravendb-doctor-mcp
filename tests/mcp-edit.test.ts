import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HELPER = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "scripts",
  "mcp-edit.mjs"
);

let tmp: string;
let mcp: string;

function run(...args: string[]) {
  return spawnSync(process.execPath, [HELPER, ...args], { encoding: "utf8" });
}

function readMcp() {
  return JSON.parse(fs.readFileSync(mcp, "utf8"));
}

function writeMcp(obj: unknown) {
  fs.writeFileSync(mcp, JSON.stringify(obj, null, 2));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-edit-test-"));
  mcp = path.join(tmp, ".mcp.json");
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("mcp-edit add", () => {
  it("creates the file and inserts the entry when it does not exist", () => {
    const r = run("add", mcp, "ravendb-doctor-test", "/tmp/out", "ravendb-doctor-mcp:latest");
    expect(r.status).toBe(0);
    const cfg = readMcp();
    expect(cfg.mcpServers["ravendb-doctor-test"].command).toBe("docker");
    const args = cfg.mcpServers["ravendb-doctor-test"].args;
    expect(args).toContain("/tmp/out:/data/output");
    expect(args).toContain("RAVEN_CERT_PFX_BASE64");
    expect(args).toContain("ravendb-doctor-mcp:latest");
  });

  it("preserves unrelated entries", () => {
    writeMcp({ mcpServers: { "other-server": { command: "echo", args: ["hi"] } } });
    const r = run("add", mcp, "ravendb-doctor-test", "/tmp/out", "img:tag");
    expect(r.status).toBe(0);
    const cfg = readMcp();
    expect(cfg.mcpServers["other-server"].command).toBe("echo");
    expect(cfg.mcpServers["ravendb-doctor-test"]).toBeDefined();
  });

  it("refuses to overwrite an existing entry with exit 2", () => {
    writeMcp({
      mcpServers: {
        "ravendb-doctor-test": { command: "preexisting", args: [] },
        "other-server": { command: "echo", args: [] },
      },
    });
    const r = run("add", mcp, "ravendb-doctor-test", "/tmp/out", "img:tag");
    expect(r.status).toBe(2);
    const cfg = readMcp();
    expect(cfg.mcpServers["ravendb-doctor-test"].command).toBe("preexisting");
    expect(cfg.mcpServers["other-server"]).toBeDefined();
  });
});

describe("mcp-edit remove", () => {
  it("removes the named entry and leaves others intact", () => {
    writeMcp({
      mcpServers: {
        "ravendb-doctor-test": { command: "docker", args: [] },
        "other-server": { command: "echo", args: [] },
      },
    });
    const r = run("remove", mcp, "ravendb-doctor-test");
    expect(r.status).toBe(0);
    const cfg = readMcp();
    expect(cfg.mcpServers["ravendb-doctor-test"]).toBeUndefined();
    expect(cfg.mcpServers["other-server"]).toBeDefined();
  });

  it("is a no-op when the file does not exist", () => {
    const r = run("remove", mcp, "ravendb-doctor-test");
    expect(r.status).toBe(0);
    expect(fs.existsSync(mcp)).toBe(false);
  });

  it("is a no-op when the entry is not present", () => {
    writeMcp({ mcpServers: { "other-server": { command: "echo", args: [] } } });
    const r = run("remove", mcp, "ravendb-doctor-test");
    expect(r.status).toBe(0);
    const cfg = readMcp();
    expect(cfg.mcpServers["other-server"]).toBeDefined();
  });
});
