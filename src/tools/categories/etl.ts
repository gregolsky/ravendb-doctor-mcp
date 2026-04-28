import { z } from "zod";
import { DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

const EtlParams = DbParams.extend({
  name: z.array(z.string()).optional().describe("Filter by ETL task names"),
});

export const endpoints: EndpointDef[] = [
  {
    name: "db_etl_stats",
    path: "/databases/{databaseName}/etl/stats",
    category: "etl",
    auth: "ValidUser",
    params: EtlParams,
    description: "ETL task statistics: processed counts, last batch info, and error counts.",
  },
  {
    name: "db_etl_debug_stats",
    path: "/databases/{databaseName}/etl/debug/stats",
    category: "etl",
    auth: "ValidUser",
    params: EtlParams,
    description: "Detailed ETL debug statistics: internal counters, transformation times, and queue depths.",
  },
  {
    name: "db_etl_performance",
    path: "/databases/{databaseName}/etl/performance",
    category: "etl",
    auth: "ValidUser",
    params: EtlParams,
    description: "ETL performance history: recent batch durations, throughput, and transformation metrics.",
  },
  {
    name: "db_etl_progress",
    path: "/databases/{databaseName}/etl/progress",
    category: "etl",
    auth: "ValidUser",
    params: EtlParams,
    description: "ETL progress: last processed etag, lag, and estimated catch-up time.",
  },
];
