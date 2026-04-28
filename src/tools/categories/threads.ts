import { z } from "zod";
import { ServerParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_threads_stack_trace",
    path: "/admin/debug/threads/stack-trace",
    category: "threads",
    auth: "Operator",
    params: ServerParams.extend({
      threadId: z.array(z.string()).optional().describe("Filter to specific thread IDs"),
      includeStackObjects: z.boolean().optional().describe("Include managed stack objects in trace"),
      download: z.boolean().optional().describe("Return as a downloadable file"),
    }),
    timeoutMs: 120_000,
    description: "Stack traces for server threads. Uses raven-debug utility. Useful for diagnosing hangs.",
  },
  {
    name: "admin_threads_runaway",
    path: "/admin/debug/threads/runaway",
    category: "threads",
    auth: "Operator",
    params: ServerParams.extend({
      samplesCount: z.number().int().min(1).optional().describe("Number of CPU samples to collect (default 1)"),
      intervalInMs: z.number().int().min(1).optional().describe("Interval between samples in ms"),
      maxTopThreads: z.number().int().min(1).optional().describe("Maximum number of top CPU threads to report"),
    }),
    description: "CPU usage per thread sampled over time. Identifies runaway or CPU-spinning threads.",
  },
  {
    name: "admin_threads_contention",
    path: "/admin/debug/threads/contention",
    category: "threads",
    auth: "Operator",
    params: ServerParams.extend({
      delay: z.number().int().min(1).optional().describe("Sampling duration in seconds (default 30)"),
    }),
    description: "Lock contention events and durations over a sampling window.",
  },
];
