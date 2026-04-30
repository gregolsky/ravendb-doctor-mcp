import { z } from "zod";
import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";
import { redactAdminDatabasesRecord } from "../../util/redact.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_tasks",
    path: "/databases/{databaseName}/tasks",
    category: "tasks",
    auth: "ValidUser",
    params: DbParams,
    description: "All ongoing tasks for the database: ETL, replication, backups, subscriptions, and their status.",
  },
  {
    name: "db_subscriptions",
    path: "/databases/{databaseName}/subscriptions",
    category: "tasks",
    auth: "ValidUser",
    params: DbParams.extend({
      start: z.number().int().optional().describe("Pagination offset"),
      pageSize: z.number().int().optional().describe("Max subscriptions to return"),
      history: z.boolean().optional().describe("Include connection history (default false)"),
      running: z.boolean().optional().describe("Return only running subscriptions (default false)"),
      id: z.number().int().optional().describe("Filter by subscription ID"),
      name: z.string().optional().describe("Filter by subscription name"),
    }),
    description: "List document subscriptions: state, last batch etag, connected workers, and history.",
  },
  {
    name: "db_admin_tombstones_state",
    path: "/databases/{databaseName}/admin/tombstones/state",
    category: "tasks",
    auth: "DatabaseAdmin",
    params: DbParams,
    description: "Tombstone cleanup state: minimum etag blocking cleanup per task (replication, ETL, etc.).",
  },
  {
    name: "db_admin_configuration_settings",
    path: "/databases/{databaseName}/admin/configuration/settings",
    category: "tasks",
    auth: "DatabaseAdmin",
    params: DbParams,
    description: "Effective database configuration settings after applying all overrides.",
  },
  {
    name: "db_admin_record",
    path: "/databases/{databaseName}/admin/record",
    category: "tasks",
    auth: "DatabaseAdmin",
    params: DbParams,
    description: "Full database record as stored in the cluster: topology, tasks, settings, expiration config.",
    transform: redactAdminDatabasesRecord,
  },
];
