import { z } from "zod";
import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_replication_debug_outgoing_failures",
    path: "/databases/{databaseName}/replication/debug/outgoing-failures",
    category: "replication",
    auth: "ValidUser",
    params: DbParams,
    description: "Outgoing replication failure log: destination, error, and retry schedule.",
  },
  {
    name: "db_replication_debug_incoming_last_activity",
    path: "/databases/{databaseName}/replication/debug/incoming-last-activity-time",
    category: "replication",
    auth: "ValidUser",
    params: DbParams,
    description: "Last activity time for all incoming replication connections.",
  },
  {
    name: "db_replication_debug_incoming_rejection_info",
    path: "/databases/{databaseName}/replication/debug/incoming-rejection-info",
    category: "replication",
    auth: "ValidUser",
    params: DbParams,
    description: "Info about rejected incoming replication connections and the reason for rejection.",
  },
  {
    name: "db_replication_debug_outgoing_reconnect_queue",
    path: "/databases/{databaseName}/replication/debug/outgoing-reconnect-queue",
    category: "replication",
    auth: "ValidUser",
    params: DbParams,
    description: "Outgoing replication reconnect queue: which destinations are pending reconnection.",
  },
  {
    name: "db_replication_progress",
    path: "/databases/{databaseName}/replication/progress",
    category: "replication",
    auth: "ValidUser",
    params: DbParams.extend({
      name: z.array(z.string()).optional().describe("Filter by replication task names"),
    }),
    description: "Replication progress: last sent etag, lag, and connection status per destination.",
  },
  {
    name: "db_replication_internal_outgoing_progress",
    path: "/databases/{databaseName}/replication/internal/outgoing/progress",
    category: "replication",
    auth: "ValidUser",
    params: DbParams.extend({
      name: z.array(z.string()).optional().describe("Filter by replication connection names"),
    }),
    description: "Internal outgoing replication progress details: batch sizes, send rates, and etag gaps.",
  },
];
