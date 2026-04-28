import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_collections_stats",
    path: "/databases/{databaseName}/collections/stats",
    category: "collections",
    auth: "ValidUser",
    params: DbParams,
    description: "Collection statistics: document count and size per collection.",
  },
  {
    name: "db_collections_stats_detailed",
    path: "/databases/{databaseName}/collections/stats/detailed",
    category: "collections",
    auth: "ValidUser",
    params: DbParams,
    description: "Detailed collection statistics including revision counts and tombstone information.",
  },
  {
    name: "db_revisions_collections_stats",
    path: "/databases/{databaseName}/revisions/collections/stats",
    category: "collections",
    auth: "ValidUser",
    params: DbParams,
    description: "Revision statistics grouped by collection: count, size, and enforcement status.",
  },
];
