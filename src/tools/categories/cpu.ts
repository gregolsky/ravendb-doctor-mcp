import { ServerParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_cpu_stats",
    path: "/admin/debug/cpu/stats",
    category: "cpu",
    auth: "Operator",
    params: ServerParams,
    description: "CPU and thread pool statistics: utilization, queue depth, completion port.",
  },
  {
    name: "admin_proc_stats",
    path: "/admin/debug/proc/stats",
    category: "cpu",
    auth: "Operator",
    params: ServerParams,
    description: "Process statistics: memory, thread count, loaded modules, handle count.",
  },
  {
    name: "admin_proc_status",
    path: "/admin/debug/proc/status",
    category: "cpu",
    auth: "Operator",
    params: ServerParams,
    description: "Contents of /proc/self/status (Linux only). Process resource usage from the kernel.",
  },
  {
    name: "admin_proc_meminfo",
    path: "/admin/debug/proc/meminfo",
    category: "cpu",
    auth: "Operator",
    params: ServerParams,
    description: "Contents of /proc/meminfo (Linux only). System-wide memory statistics from the kernel.",
  },
];
