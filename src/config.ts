import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

const CertSchema = z
  .object({
    pfx: z.string().optional(),
    password: z.string().optional(),
    pem: z.string().optional(),
    key: z.string().optional(),
    ca: z.string().optional(),
  })
  .refine(
    (c) => c.pfx || (c.pem && c.key),
    "cert must specify either pfx or both pem+key"
  );

const ConfigSchema = z.object({
  nodeUrls: z.array(z.string().url()).min(1),
  cert: CertSchema.optional(),
  outputDir: z.string().default("/data/output"),
  defaultTimeoutMs: z.number().int().positive().optional(),
  spillThresholdBytes: z.number().int().positive().default(256 * 1024),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadFromEnv(): Partial<z.input<typeof ConfigSchema>> {
  const env = process.env;
  const out: Record<string, unknown> = {};

  if (env.RAVEN_NODE_URLS) {
    out.nodeUrls = env.RAVEN_NODE_URLS.split(",").map((u) => u.trim());
  }
  if (env.RAVEN_OUTPUT_DIR) out.outputDir = env.RAVEN_OUTPUT_DIR;
  if (env.RAVEN_LOG_LEVEL) out.logLevel = env.RAVEN_LOG_LEVEL;
  if (env.RAVEN_TIMEOUT_MS) out.defaultTimeoutMs = parseInt(env.RAVEN_TIMEOUT_MS, 10);
  if (env.RAVEN_SPILL_THRESHOLD_BYTES)
    out.spillThresholdBytes = parseInt(env.RAVEN_SPILL_THRESHOLD_BYTES, 10);

  const cert: Record<string, string> = {};
  if (env.RAVEN_CERT_PFX) cert.pfx = env.RAVEN_CERT_PFX;
  if (env.RAVEN_CERT_PASSWORD) cert.password = env.RAVEN_CERT_PASSWORD;
  if (env.RAVEN_CERT_PEM) cert.pem = env.RAVEN_CERT_PEM;
  if (env.RAVEN_CERT_KEY) cert.key = env.RAVEN_CERT_KEY;
  if (env.RAVEN_CERT_CA) cert.ca = env.RAVEN_CERT_CA;
  if (Object.keys(cert).length > 0) out.cert = cert;

  return out;
}

function loadFromFile(): Partial<z.input<typeof ConfigSchema>> {
  const candidates = [
    process.env.RAVEN_CONFIG_FILE,
    "/etc/ravendb-mcp/config.json",
    path.join(process.cwd(), "ravendb-mcp.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  }
  return {};
}

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  const merged = { ...loadFromFile(), ...loadFromEnv() };
  _config = ConfigSchema.parse(merged);
  return _config;
}

export function resetConfig(): void {
  _config = null;
}
