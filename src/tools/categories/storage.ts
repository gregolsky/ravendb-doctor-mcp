import { z } from "zod";
import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

const StorageEnvParams = DbParams.extend({
  name: z.string().optional().describe("Storage environment name"),
  type: z.string().optional().describe("Storage environment type (e.g. Documents, Index, Configuration)"),
});

export const endpoints: EndpointDef[] = [
  {
    name: "db_storage_trees",
    path: "/databases/{databaseName}/debug/storage/trees",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    description: "List all storage trees in the database: VariableSizeTree, FixedSizeTree, EmbeddedFixedSizeTree.",
  },
  {
    name: "db_storage_report",
    path: "/databases/{databaseName}/debug/storage/report",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    timeoutMs: 5 * 60_000,
    description: "Storage report for the main database environment: allocated/used pages per tree.",
  },
  {
    name: "db_storage_all_environments_report",
    path: "/databases/{databaseName}/debug/storage/all-environments/report",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    timeoutMs: 5 * 60_000,
    description: "Storage reports for all environments (documents, indexes, configuration). Can be large.",
  },
  {
    name: "db_storage_environment_report",
    path: "/databases/{databaseName}/debug/storage/environment/report",
    category: "storage",
    auth: "ValidUser",
    params: StorageEnvParams,
    timeoutMs: 5 * 60_000,
    description: "Storage report for a specific named storage environment.",
  },
  {
    name: "db_storage_btree_structure",
    path: "/databases/{databaseName}/debug/storage/btree-structure",
    category: "storage",
    auth: "ValidUser",
    params: DbParams.extend({
      name: z.string().describe("B-tree name to visualize"),
    }),
    description: "B-tree structure visualization (returns HTML). Shows page layout and fill factors.",
  },
  {
    name: "db_storage_fst_structure",
    path: "/databases/{databaseName}/debug/storage/fst-structure",
    category: "storage",
    auth: "ValidUser",
    params: DbParams.extend({
      name: z.string().describe("Fixed-size tree name to visualize"),
    }),
    description: "Fixed-size tree structure visualization (returns HTML).",
  },
  {
    name: "db_storage_compression_dictionaries",
    path: "/databases/{databaseName}/debug/storage/compression-dictionaries",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    description: "Compression dictionary info: trained dictionaries, sizes, and associated collections.",
  },
  {
    name: "db_storage_scratch_buffer_info",
    path: "/databases/{databaseName}/debug/storage/environment/scratch-buffer-info",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    description: "Scratch buffer usage info for the storage layer.",
  },
  {
    name: "db_storage_free_space_snapshot",
    path: "/databases/{databaseName}/debug/storage/environment/free-space-snapshot",
    category: "storage",
    auth: "ValidUser",
    params: DbParams,
    description: "Snapshot of free space available in the storage environment.",
  },
];
