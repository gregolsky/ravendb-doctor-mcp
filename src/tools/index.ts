import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RavenClient } from "../http/client.js";
import { buildTool } from "./registry.js";
import { registerDashboard } from "./categories/dashboard.js";

import { endpoints as memory } from "./categories/memory.js";
import { endpoints as threads } from "./categories/threads.js";
import { endpoints as cpu } from "./categories/cpu.js";
import { endpoints as io } from "./categories/io.js";
import { endpoints as network } from "./categories/network.js";
import { endpoints as cluster } from "./categories/cluster.js";
import { endpoints as transactions } from "./categories/transactions.js";
import { endpoints as dumps } from "./categories/dumps.js";
import { endpoints as infoPackages } from "./categories/infoPackages.js";
import { endpoints as serverInfo } from "./categories/serverInfo.js";
import { endpoints as notifications } from "./categories/notifications.js";
import { endpoints as queries } from "./categories/queries.js";
import { endpoints as documents } from "./categories/documents.js";
import { endpoints as indexes } from "./categories/indexes.js";
import { endpoints as storage } from "./categories/storage.js";
import { endpoints as identities } from "./categories/identities.js";
import { endpoints as scriptRunners } from "./categories/scriptRunners.js";
import { endpoints as replication } from "./categories/replication.js";
import { endpoints as etl } from "./categories/etl.js";
import { endpoints as collections } from "./categories/collections.js";
import { endpoints as tasks } from "./categories/tasks.js";

const ALL_ENDPOINTS = [
  ...memory,
  ...threads,
  ...cpu,
  ...io,
  ...network,
  ...cluster,
  ...transactions,
  ...dumps,
  ...infoPackages,
  ...serverInfo,
  ...notifications,
  ...queries,
  ...documents,
  ...indexes,
  ...storage,
  ...identities,
  ...scriptRunners,
  ...replication,
  ...etl,
  ...collections,
  ...tasks,
];

export function registerAll(server: McpServer, client: RavenClient): void {
  const names = new Set<string>();
  for (const def of ALL_ENDPOINTS) {
    if (names.has(def.name)) {
      throw new Error(`Duplicate tool name: ${def.name}`);
    }
    names.add(def.name);
    buildTool(server, client, def);
  }
  registerDashboard(server, client);
}

export { ALL_ENDPOINTS };
