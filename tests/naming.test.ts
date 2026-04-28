import { describe, it, expect } from "vitest";
import { pathToToolName } from "../src/tools/naming.js";

describe("pathToToolName", () => {
  it("converts admin debug paths", () => {
    expect(pathToToolName("/admin/debug/memory/stats")).toBe("admin_memory_stats");
    expect(pathToToolName("/admin/debug/threads/stack-trace")).toBe("admin_threads_stack_trace");
    expect(pathToToolName("/admin/debug/info-package")).toBe("admin_info_package");
    expect(pathToToolName("/admin/debug/node/ping")).toBe("admin_node_ping");
  });

  it("converts admin non-debug paths", () => {
    expect(pathToToolName("/admin/cluster/log")).toBe("admin_cluster_log");
    expect(pathToToolName("/admin/stats")).toBe("admin_stats");
  });

  it("converts database-scoped paths", () => {
    expect(pathToToolName("/databases/*/debug/queries/running")).toBe("db_debug_queries_running");
    expect(pathToToolName("/databases/*/debug/storage/report")).toBe("db_debug_storage_report");
    expect(pathToToolName("/databases/*/indexes/stats")).toBe("db_indexes_stats");
  });

  it("converts server-level debug paths", () => {
    expect(pathToToolName("/debug/server-id")).toBe("server_server_id");
    expect(pathToToolName("/debug/routes")).toBe("server_routes");
  });

  it("converts cluster paths", () => {
    expect(pathToToolName("/cluster/topology")).toBe("cluster_topology");
    expect(pathToToolName("/cluster/node-info")).toBe("cluster_node_info");
  });
});
