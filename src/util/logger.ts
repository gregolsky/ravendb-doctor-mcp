import pino from "pino";
import { getConfig } from "../config.js";

let _logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!_logger) {
    const cfg = getConfig();
    _logger = pino({
      level: cfg.logLevel ?? "info",
      redact: {
        paths: ["cert.password", "*.password", "*.passphrase", "env.RAVEN_CERT_PASSWORD"],
        censor: "[REDACTED]",
      },
    });
  }
  return _logger;
}
