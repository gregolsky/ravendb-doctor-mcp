import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RavenClient, ToolResult } from "../http/client.js";
import { getLogger } from "../util/logger.js";
import { getConfig } from "../config.js";
import { writeAuditEntry } from "../util/audit.js";

export type AuthLevel = "ValidUser" | "Operator" | "DatabaseAdmin" | "ClusterAdmin";

export interface EndpointDef<P extends z.AnyZodObject = z.AnyZodObject> {
  name: string;
  path: string;
  category: string;
  auth: AuthLevel;
  params: P;
  binary?: boolean;
  description: string;
  timeoutMs?: number;
  transform?: (data: unknown) => unknown;
  dangerous?: boolean;
}

export const ServerParams = z.object({
  nodeUrl: z.string().url().optional().describe("Override which cluster node to target"),
});

export const DbParams = ServerParams.extend({
  databaseName: z.string().min(1).describe("Database name"),
});

export const PaginationParams = z.object({
  start: z.number().int().min(0).optional().describe("Offset for pagination"),
  pageSize: z.number().int().min(1).optional().describe("Max results per page"),
});

function formatResult(result: ToolResult): string {
  switch (result.type) {
    case "json":
      return JSON.stringify(result.data, null, 2);
    case "file":
      return JSON.stringify({
        filePath: result.result.filePath,
        bytes: result.result.bytes,
        sha256: result.result.sha256,
        contentType: result.result.contentType,
      });
    case "spill":
      return JSON.stringify({
        filePath: result.filePath,
        bytes: result.bytes,
        note: "Response exceeded size threshold; full content saved to filePath",
        preview: result.preview,
      });
  }
}

export function buildTool(
  server: McpServer,
  client: RavenClient,
  def: EndpointDef
): void {
  const log = getLogger();

  server.tool(def.name, def.description, def.params.shape, async (args: Record<string, unknown>) => {
    const start = Date.now();
    const cfg = getConfig();

    if (def.dangerous && !cfg.allowDestructiveTools) {
      writeAuditEntry({ ts: new Date().toISOString(), tool: def.name, args, durationMs: 0, ok: false, error: "blocked: allowDestructiveTools is false" });
      return {
        content: [{ type: "text" as const, text: "Error: this tool is disabled. Set allowDestructiveTools: true in config (or RAVEN_ALLOW_DESTRUCTIVE_TOOLS=true) to enable it." }],
        isError: true,
      };
    }

    log.info({ tool: def.name }, "tool called");
    let ok = true;
    let error: string | undefined;
    try {
      const parsed = def.params.parse(args);
      const result = await client.request(def, parsed as Record<string, unknown>);
      return {
        content: [{ type: "text" as const, text: formatResult(result) }],
      };
    } catch (err) {
      ok = false;
      error = err instanceof Error ? err.message : String(err);
      log.error({ tool: def.name, err: error }, "tool error");
      return {
        content: [{ type: "text" as const, text: `Error: ${error}` }],
        isError: true,
      };
    } finally {
      writeAuditEntry({ ts: new Date().toISOString(), tool: def.name, args, durationMs: Date.now() - start, ok, error });
    }
  });
}
