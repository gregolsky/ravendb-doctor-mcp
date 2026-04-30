// Port of Cloud.RavenDB.Core/Utils/AdminDatabasesRedactor.cs (RDBCL-5034).
// Keep SENSITIVE_KEYS and PARENT_SCOPED in sync with that file when new
// connection string types or credential fields are added on the cloud side.
const SENSITIVE_KEYS = new Set([
  "awsaccesskey",
  "awssecretkey",
  "awssessiontoken",
  "accountkey",
  "sastoken",
  "clientsecret",
  "password",
  "certificateasbase64",
  "googlecredentialsjson",
  "encodedapikey",
  "certificatesbase64",
  "apikey",
  "apikeyid",
  "connectionstring",
  "connectionoptions",
]);

// key → set of child property names to redact when parent matches
const PARENT_SCOPED: Record<string, Set<string>> = {
  backupencryptionsettings: new Set(["key"]),
};

export function redactAdminDatabasesRecord(data: unknown): unknown {
  walk(data, null);
  return data;
}

function walk(node: unknown, parentName: string | null): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, parentName);
    return;
  }
  if (node === null || typeof node !== "object") return;

  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower)) {
      obj[key] = null;
      continue;
    }
    if (parentName !== null && PARENT_SCOPED[parentName]?.has(lower)) {
      obj[key] = null;
      continue;
    }
    walk(obj[key], lower);
  }
}
