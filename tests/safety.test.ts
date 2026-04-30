import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resetConfig } from "../src/config.js";

beforeEach(() => {
  process.env.RAVEN_NODE_URLS = "http://a.example.com:8080,http://b.example.com:8080";
  process.env.RAVEN_OUTPUT_DIR = "/tmp";
  delete process.env.RAVEN_ALLOW_DESTRUCTIVE_TOOLS;
  resetConfig();
});

afterEach(() => {
  delete process.env.RAVEN_NODE_URLS;
  delete process.env.RAVEN_OUTPUT_DIR;
  delete process.env.RAVEN_ALLOW_DESTRUCTIVE_TOOLS;
  resetConfig();
});

describe("SSRF guard", () => {
  it("allows nodeUrl matching a configured node origin", async () => {
    const { RavenClient } = await import("../src/http/client.js");
    const { getConfig } = await import("../src/config.js");
    const client = new RavenClient(getConfig());
    // Should not throw for a configured origin
    await expect(
      client.request(
        { name: "test", path: "/test", category: "x", auth: "Operator", params: {} as never, description: "" },
        { nodeUrl: "http://a.example.com:8080" }
      )
    ).rejects.toThrow(/ECONNREFUSED|fetch|connect|network/i); // network error, not SSRF error
    await client.destroy();
  });

  it("blocks nodeUrl not in the configured node list", async () => {
    const { RavenClient } = await import("../src/http/client.js");
    const { getConfig } = await import("../src/config.js");
    const client = new RavenClient(getConfig());
    await expect(
      client.request(
        { name: "test", path: "/test", category: "x", auth: "Operator", params: {} as never, description: "" },
        { nodeUrl: "http://169.254.169.254" }
      )
    ).rejects.toThrow(/not in the configured node list/);
    await client.destroy();
  });

  it("blocks nodeUrl with same host but different port", async () => {
    const { RavenClient } = await import("../src/http/client.js");
    const { getConfig } = await import("../src/config.js");
    const client = new RavenClient(getConfig());
    await expect(
      client.request(
        { name: "test", path: "/test", category: "x", auth: "Operator", params: {} as never, description: "" },
        { nodeUrl: "http://a.example.com:9999" }
      )
    ).rejects.toThrow(/not in the configured node list/);
    await client.destroy();
  });
});

describe("allowDestructiveTools", () => {
  it("allowDestructiveTools defaults to false", async () => {
    const { getConfig } = await import("../src/config.js");
    expect(getConfig().allowDestructiveTools).toBe(false);
  });

  it("RAVEN_ALLOW_DESTRUCTIVE_TOOLS=true enables the flag", async () => {
    process.env.RAVEN_ALLOW_DESTRUCTIVE_TOOLS = "true";
    resetConfig();
    const { getConfig } = await import("../src/config.js");
    expect(getConfig().allowDestructiveTools).toBe(true);
  });

  it("RAVEN_ALLOW_DESTRUCTIVE_TOOLS=false keeps flag off", async () => {
    process.env.RAVEN_ALLOW_DESTRUCTIVE_TOOLS = "false";
    resetConfig();
    const { getConfig } = await import("../src/config.js");
    expect(getConfig().allowDestructiveTools).toBe(false);
  });
});
