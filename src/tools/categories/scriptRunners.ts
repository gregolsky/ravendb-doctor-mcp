import { z } from "zod";
import { ServerParams, DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_debug_script_runners",
    path: "/admin/debug/script-runners",
    category: "scriptRunners",
    auth: "Operator",
    params: ServerParams,
    description: "Server-wide JavaScript engine (Jint) pool debug info.",
  },
  {
    name: "db_debug_script_runners",
    path: "/databases/{databaseName}/debug/script-runners",
    category: "scriptRunners",
    auth: "ValidUser",
    params: DbParams.extend({
      detailed: z.boolean().optional().describe("Include detailed script runner state (default false)"),
    }),
    description: "JavaScript script runner debug info for a database: pool size, active scripts, and stats.",
  },
];
