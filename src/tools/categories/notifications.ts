import { z } from "zod";
import { ServerParams, DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

const NotificationParams = z.object({
  postponed: z.boolean().optional().describe("Include postponed notifications (default true)"),
  type: z.string().optional().describe("Filter by notification type"),
  pageStart: z.number().int().min(0).optional().describe("Pagination start offset"),
  pageSize: z.number().int().min(1).optional().describe("Max results to return"),
});

export const endpoints: EndpointDef[] = [
  {
    name: "server_notifications",
    path: "/admin/server/notifications",
    category: "notifications",
    auth: "Operator",
    params: ServerParams.merge(NotificationParams),
    description: "Server-level alerts and performance hints from the notification center.",
  },
  {
    name: "db_notifications",
    path: "/databases/{databaseName}/notifications",
    category: "notifications",
    auth: "ValidUser",
    params: DbParams.merge(NotificationParams),
    description: "Database-level alerts and performance hints: indexing errors, ETL failures, low disk, etc.",
  },
];
