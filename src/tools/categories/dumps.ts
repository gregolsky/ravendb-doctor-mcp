import { z } from "zod";
import { ServerParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_dump",
    path: "/admin/debug/dump",
    category: "dumps",
    auth: "ClusterAdmin",
    binary: true,
    dangerous: true,
    params: ServerParams.extend({
      type: z.enum(["Mini", "Heap", "Full", "Triage"]).describe("Dump type"),
      path: z.string().optional().describe("Server-side path where the dump will be written (optional)"),
    }),
    timeoutMs: 15 * 60_000,
    description: "Generate a process memory dump (gzip-compressed). Saved to outputDir. Large operation.",
  },
  {
    name: "admin_gcdump",
    path: "/admin/debug/gcdump",
    category: "dumps",
    auth: "ClusterAdmin",
    binary: true,
    dangerous: true,
    params: ServerParams.extend({
      timeout: z.number().int().optional().describe("Timeout in seconds for the GC dump (default 30)"),
      path: z.string().optional().describe("Server-side path for the dump (optional)"),
    }),
    timeoutMs: 15 * 60_000,
    description: "Generate a GC dump (gzip-compressed). Saved to outputDir. Useful for memory analysis.",
  },
];
