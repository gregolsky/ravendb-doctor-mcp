import fs from "node:fs";
import type { Config } from "../config.js";

export function buildTlsOptions(cert: Config["cert"]): Record<string, unknown> {
  if (!cert) return {};
  if (cert.pfx || cert.pfxBase64) {
    return {
      pfx: cert.pfxBase64
        ? Buffer.from(cert.pfxBase64, "base64")
        : fs.readFileSync(cert.pfx!),
      passphrase: cert.password,
      ...(cert.ca ? { ca: fs.readFileSync(cert.ca) } : {}),
    };
  }
  return {
    cert: cert.pem ? fs.readFileSync(cert.pem) : undefined,
    key: cert.key ? fs.readFileSync(cert.key) : undefined,
    passphrase: cert.password,
    ...(cert.ca ? { ca: fs.readFileSync(cert.ca) } : {}),
  };
}
