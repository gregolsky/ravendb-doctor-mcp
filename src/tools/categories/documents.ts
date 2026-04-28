import { z } from "zod";
import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "db_documents_huge",
    path: "/databases/{databaseName}/debug/documents/huge",
    category: "documents",
    auth: "ValidUser",
    params: DbParams,
    description: "List of huge documents: ID, size in bytes, and last modification time.",
  },
  {
    name: "db_documents_scan_corrupted_ids",
    path: "/databases/{databaseName}/debug/documents/scan-corrupted-ids",
    category: "documents",
    auth: "ValidUser",
    params: DbParams.extend({
      startEtag: z.number().int().optional().describe("Start scanning from this etag"),
      resultCount: z.number().int().optional().describe("Max results (default 1024)"),
      maxBatchTimeInSec: z.number().int().optional().describe("Max scan time in seconds (default 60)"),
    }),
    description: "Scan for documents with corrupted IDs (control characters, incorrect escaping).",
  },
  {
    name: "db_documents_get_revisions",
    path: "/databases/{databaseName}/debug/documents/get-revisions",
    category: "documents",
    auth: "ValidUser",
    params: DbParams.extend({
      id: z.string().describe("Document ID"),
      start: z.number().int().optional().describe("Start offset for revisions"),
      pageSize: z.number().int().optional().describe("Max revisions to return"),
    }),
    description: "Retrieve document revisions for a specific document ID.",
  },
  {
    name: "db_documents_export_all_ids",
    path: "/databases/{databaseName}/debug/documents/export-all-ids",
    category: "documents",
    auth: "ValidUser",
    params: DbParams,
    timeoutMs: 5 * 60_000,
    description: "Export all document IDs in the database. Useful for inventory and integrity checks.",
  },
  {
    name: "db_debug_attachments_missing",
    path: "/databases/{databaseName}/debug/attachments/missing",
    category: "documents",
    auth: "ValidUser",
    params: DbParams.extend({
      type: z.string().optional().describe("Filter by attachment type"),
      collection: z.string().describe("Collection name to scan"),
      start: z.number().int().optional().describe("Start etag for scanning"),
      pageSize: z.number().int().optional().describe("Max results to return"),
    }),
    description: "Find documents in a collection that reference missing or broken attachments.",
  },
];
