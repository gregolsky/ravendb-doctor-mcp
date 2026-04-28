import { z } from "zod";
import { ServerParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "cluster_node_info",
    path: "/cluster/node-info",
    category: "cluster",
    auth: "ValidUser",
    params: ServerParams,
    description: "Current node identity, tag, state, and cluster membership details.",
  },
  {
    name: "cluster_topology",
    path: "/cluster/topology",
    category: "cluster",
    auth: "ValidUser",
    params: ServerParams.extend({
      clientIndependent: z.boolean().optional().describe("Return topology independent of client topology (default false)"),
    }),
    description: "Cluster topology: node URLs, tags, status, and Raft term.",
  },
  {
    name: "admin_cluster_observer_decisions",
    path: "/admin/cluster/observer/decisions",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "Recent cluster observer decisions: why databases were moved between nodes.",
  },
  {
    name: "admin_cluster_log",
    path: "/admin/cluster/log",
    category: "cluster",
    auth: "Operator",
    params: ServerParams.extend({
      from: z.number().int().optional().describe("Start from this log index"),
      pageSize: z.number().int().min(1).optional().describe("Number of log entries to return (default 1024)"),
      detailed: z.boolean().optional().describe("Include detailed entry content (default false)"),
    }),
    description: "Raft cluster log entries. Useful for understanding cluster state transitions.",
  },
  {
    name: "admin_cluster_history_logs",
    path: "/admin/debug/cluster/history-logs",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "In-memory history of cluster state machine transitions.",
  },
  {
    name: "admin_cluster_maintenance_stats",
    path: "/admin/cluster/maintenance-stats",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "Cluster maintenance statistics: database health checks, shard distribution.",
  },
  {
    name: "admin_node_remote_connections",
    path: "/admin/debug/node/remote-connections",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "Active inter-node remote connections: caller, destination, Raft term, and duration.",
  },
  {
    name: "admin_node_engine_logs",
    path: "/admin/debug/node/engine-logs",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "Recent in-memory Raft engine logs from the current node.",
  },
  {
    name: "admin_node_state_change_history",
    path: "/admin/debug/node/state-change-history",
    category: "cluster",
    auth: "Operator",
    params: ServerParams,
    description: "History of Raft node state changes (leader, follower, candidate, passive).",
  },
  {
    name: "admin_node_ping",
    path: "/admin/debug/node/ping",
    category: "cluster",
    auth: "Operator",
    params: ServerParams.extend({
      url: z.string().optional().describe("Target node URL to ping (omit to ping all nodes)"),
      node: z.string().optional().describe("Target node tag to ping"),
      setStatusCodeOnError: z.boolean().optional().describe("Return non-200 status on ping failure"),
    }),
    description: "Ping cluster nodes via HTTP and TCP. Measures negotiation timing and connection health.",
  },
];
