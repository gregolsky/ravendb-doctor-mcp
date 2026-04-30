import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getConfig } from "./config.js";
import { getLogger } from "./util/logger.js";
import { RavenClient } from "./http/client.js";
import { registerAll } from "./tools/index.js";
import fs from "node:fs";

async function main(): Promise<void> {
  const cfg = getConfig();
  const log = getLogger();

  fs.mkdirSync(cfg.outputDir, { recursive: true });

  log.info(
    {
      nodes: cfg.nodeUrls.length,
      certType: cfg.cert?.pfx ? "pfx" : cfg.cert?.pem ? "pem" : "none",
      outputDir: cfg.outputDir,
    },
    "ravendb-doctor-mcp starting"
  );

  const client = new RavenClient(cfg);

  const server = new McpServer({
    name: "ravendb-doctor-mcp",
    version: "1.0.0",
  });

  registerAll(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info("MCP server connected, ready");

  process.on("SIGINT", async () => {
    await client.destroy();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await client.destroy();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
