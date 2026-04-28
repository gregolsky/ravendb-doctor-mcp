import { z } from "zod";
import { ServerParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_memory_gc",
    path: "/admin/debug/memory/gc",
    category: "memory",
    auth: "Operator",
    params: ServerParams,
    description: "GC memory info: all kinds, background, ephemeral, full-blocking collections.",
  },
  {
    name: "admin_memory_low_mem_log",
    path: "/admin/debug/memory/low-mem-log",
    category: "memory",
    auth: "Operator",
    params: ServerParams,
    description: "Log of low-memory events and the actions taken by the server.",
  },
  {
    name: "admin_memory_stats",
    path: "/admin/debug/memory/stats",
    category: "memory",
    auth: "Operator",
    params: ServerParams.extend({
      includeThreads: z.boolean().optional().describe("Include per-thread allocations (default true)"),
      includeMappings: z.boolean().optional().describe("Include memory file mappings (default true)"),
    }),
    description: "Detailed memory statistics: managed/unmanaged heaps, thread allocations, file mappings.",
  },
  {
    name: "admin_memory_smaps",
    path: "/admin/debug/memory/smaps",
    category: "memory",
    auth: "Operator",
    params: ServerParams,
    description: "Detailed memory map info from /proc/smaps (Linux) or equivalent (Windows).",
  },
  {
    name: "admin_memory_encryption_buffer_pool",
    path: "/admin/debug/memory/encryption-buffer-pool",
    category: "memory",
    auth: "Operator",
    params: ServerParams,
    description: "Statistics on the encryption buffer pool used for encrypted databases.",
  },
  {
    name: "admin_memory_allocations",
    path: "/admin/debug/memory/allocations",
    category: "memory",
    auth: "Operator",
    params: ServerParams.extend({
      delay: z.number().int().min(1).optional().describe("Sampling duration in seconds (default 5)"),
    }),
    description: "Allocation event listener results: which types are being allocated and at what rate.",
  },
  {
    name: "admin_memory_gc_events",
    path: "/admin/debug/memory/gc-events",
    category: "memory",
    auth: "Operator",
    params: ServerParams.extend({
      delay: z.number().int().min(1).optional().describe("Sampling duration in seconds (default 10)"),
    }),
    description: "GC event listener results: GC event types and top-5 by duration during the sampling window.",
  },
];
