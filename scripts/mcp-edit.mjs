#!/usr/bin/env node
// Helper for diagnose.sh: add or remove an MCP server entry in .mcp.json.
//
// Usage:
//   mcp-edit.mjs add <file> <name> <output-host-dir> <image>
//   mcp-edit.mjs remove <file> <name>
//
// Exit codes: 0 ok, 2 entry already exists (add), 3 file/parse error.

import fs from "node:fs";

const [, , action, file, name, ...rest] = process.argv;

if (!action || !file || !name) {
  console.error("usage: mcp-edit.mjs <add|remove> <file> <name> [...]");
  process.exit(64);
}

function readConfig() {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  if (!raw.trim()) return { mcpServers: {} };
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`failed to parse ${file}: ${err.message}`);
    process.exit(3);
  }
}

function writeConfig(cfg) {
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
}

if (action === "add") {
  const [outDir, image] = rest;
  if (!outDir || !image) {
    console.error("add requires <output-host-dir> <image>");
    process.exit(64);
  }
  const cfg = readConfig() ?? { mcpServers: {} };
  cfg.mcpServers ??= {};
  if (cfg.mcpServers[name]) {
    console.error(`entry '${name}' already exists in ${file}`);
    process.exit(2);
  }
  cfg.mcpServers[name] = {
    command: "docker",
    args: [
      "run", "-i", "--rm",
      "-v", `${outDir}:/data/output`,
      "-e", "RAVEN_NODE_URLS",
      "-e", "RAVEN_CERT_PFX_BASE64",
      "-e", "RAVEN_CERT_PASSWORD",
      image,
    ],
  };
  writeConfig(cfg);
} else if (action === "remove") {
  const cfg = readConfig();
  if (!cfg || !cfg.mcpServers || !cfg.mcpServers[name]) process.exit(0);
  delete cfg.mcpServers[name];
  writeConfig(cfg);
} else {
  console.error(`unknown action: ${action}`);
  process.exit(64);
}
