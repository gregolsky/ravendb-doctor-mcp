import { describe, it, expect } from "vitest";
import { ALL_ENDPOINTS } from "../src/tools/index.js";

describe("endpoint registry", () => {
  it("has no duplicate tool names", () => {
    const names = ALL_ENDPOINTS.map((e) => e.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
  });

  it("all db-scoped endpoints have databaseName in params schema", () => {
    const dbScoped = ALL_ENDPOINTS.filter((e) => e.path.includes("{databaseName}"));
    for (const ep of dbScoped) {
      expect(
        Object.keys(ep.params.shape),
        `${ep.name} is db-scoped but missing databaseName`
      ).toContain("databaseName");
    }
  });

  it("all server-scoped endpoints do NOT have databaseName in params schema", () => {
    const serverScoped = ALL_ENDPOINTS.filter((e) => !e.path.includes("{databaseName}"));
    for (const ep of serverScoped) {
      expect(
        Object.keys(ep.params.shape),
        `${ep.name} is server-scoped but has databaseName`
      ).not.toContain("databaseName");
    }
  });

  it("all binary endpoints have binary: true", () => {
    const binaryPaths = ["/admin/debug/dump", "/admin/debug/gcdump", "/admin/debug/info-package",
      "/admin/debug/cluster-info-package", "/databases/*/debug/info-package"];
    for (const path of binaryPaths) {
      const ep = ALL_ENDPOINTS.find((e) => e.path === path);
      if (ep) {
        expect(ep.binary, `${ep.name} should be binary`).toBe(true);
      }
    }
  });

  it("all tools have non-empty descriptions", () => {
    for (const ep of ALL_ENDPOINTS) {
      expect(ep.description.length, `${ep.name} has empty description`).toBeGreaterThan(0);
    }
  });

  it("reports total tool count", () => {
    console.log(`Total registered tools: ${ALL_ENDPOINTS.length}`);
    expect(ALL_ENDPOINTS.length).toBeGreaterThan(50);
  });
});
