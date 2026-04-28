import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_queries_running",
    path: "/databases/{databaseName}/debug/queries/running",
    category: "queries",
    auth: "ValidUser",
    params: DbParams,
    description: "Currently executing queries on the database: query text, duration, and execution stats.",
  },
  {
    name: "db_queries_cache_list",
    path: "/databases/{databaseName}/debug/queries/cache/list",
    category: "queries",
    auth: "ValidUser",
    params: DbParams,
    description: "Cached query plans: shows the query cache contents and hit statistics.",
  },
];
