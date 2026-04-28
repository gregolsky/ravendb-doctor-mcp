export function pathToToolName(path: string): string {
  return path
    .replace("/databases/*/", "db_")
    .replace(/^\/admin\/debug\//, "admin_")
    .replace(/^\/admin\//, "admin_")
    .replace(/^\/debug\//, "server_")
    .replace(/^\/cluster\//, "cluster_")
    .replace(/^\//,"")
    .replace(/\//g, "_")
    .replace(/-/g, "_")
    .replace(/_+/g, "_")
    .replace(/_$/g, "");
}
