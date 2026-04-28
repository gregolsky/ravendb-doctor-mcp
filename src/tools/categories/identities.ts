import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_debug_identities",
    path: "/databases/{databaseName}/debug/identities",
    category: "identities",
    auth: "ValidUser",
    params: DbParams,
    description: "Database identity values: current sequence numbers for each identity prefix.",
  },
];
