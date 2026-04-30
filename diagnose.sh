#!/usr/bin/env bash
# One-time diagnostic session: registers ravendb-doctor MCP in ./.mcp.json,
# starts claude, then removes the entry on exit.
#
# Requires: docker, node, claude, and the ravendb-doctor-mcp:latest image.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="$SCRIPT_DIR/scripts/mcp-edit.mjs"

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") --cert <pfx-path> --url <ravendb-url> [--url <url> ...] [--image <tag>]

Adds a ravendb-doctor-<slug> MCP server (slug derived from the first URL) to
./.mcp.json, starts \`claude\`, and removes the entry when claude exits.

The PFX is read once and passed to docker via RAVEN_CERT_PFX_BASE64 in the
shell environment, so secrets never get written to .mcp.json.
EOF
  exit 1
}

CERT=""
IMAGE="ravendb-doctor-mcp:latest"
URLS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cert) CERT="${2:-}"; shift 2 ;;
    --url) URLS+=("${2:-}"); shift 2 ;;
    --image) IMAGE="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown argument: $1" >&2; usage ;;
  esac
done

[[ -z "$CERT" || ${#URLS[@]} -eq 0 ]] && usage
[[ -f "$CERT" ]] || { echo "PFX file not found: $CERT" >&2; exit 1; }

for cmd in docker node claude base64; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Required command missing: $cmd" >&2; exit 1; }
done

[[ -f "$HELPER" ]] || { echo "Missing helper: $HELPER" >&2; exit 1; }

FIRST_URL="${URLS[0]}"
SUFFIX=$(echo "$FIRST_URL" \
  | sed -E 's#^https?://##; s#/.*$##; s#[^A-Za-z0-9]+#-#g; s#^-+|-+$##g' \
  | tr '[:upper:]' '[:lower:]')
[[ -n "$SUFFIX" ]] || { echo "Could not derive slug from URL: $FIRST_URL" >&2; exit 1; }

SERVER_NAME="ravendb-doctor-${SUFFIX}"
MCP_FILE=".mcp.json"
CREATED_FILE=0

read -r -s -p "PFX password (leave blank if none): " RAVEN_CERT_PASSWORD || true
echo
export RAVEN_CERT_PASSWORD

RAVEN_CERT_PFX_BASE64=$(base64 -w0 "$CERT" 2>/dev/null || base64 "$CERT" | tr -d '\n\r')
export RAVEN_CERT_PFX_BASE64

RAVEN_NODE_URLS=$(IFS=,; echo "${URLS[*]}")
export RAVEN_NODE_URLS

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) HOST_CWD="$(pwd -W)" ;;
  *) HOST_CWD="$(pwd)" ;;
esac
OUTPUT_HOST_DIR="${HOST_CWD}/ravendb-mcp-output/${SUFFIX}"
mkdir -p "$OUTPUT_HOST_DIR"

if [[ ! -f "$MCP_FILE" ]]; then
  CREATED_FILE=1
fi

ADDED=0

cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  if [[ $ADDED -eq 1 && -f "$MCP_FILE" ]]; then
    node "$HELPER" remove "$MCP_FILE" "$SERVER_NAME" || true
  fi
  if [[ $CREATED_FILE -eq 1 && -f "$MCP_FILE" ]]; then
    # Only delete the file if it's just the empty {mcpServers:{}} we created.
    if node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.exit(c.mcpServers && Object.keys(c.mcpServers).length===0 && Object.keys(c).length===1 ? 0 : 1)' "$MCP_FILE" 2>/dev/null; then
      rm -f "$MCP_FILE"
    fi
  fi
  unset RAVEN_CERT_PASSWORD RAVEN_CERT_PFX_BASE64 RAVEN_NODE_URLS
  exit "$rc"
}
trap cleanup EXIT INT TERM

ADD_RC=0
node "$HELPER" add "$MCP_FILE" "$SERVER_NAME" "$OUTPUT_HOST_DIR" "$IMAGE" || ADD_RC=$?
case $ADD_RC in
  0) ADDED=1 ;;
  2) echo "Refusing to overwrite existing MCP entry. Remove it from $MCP_FILE first." >&2; exit 1 ;;
  *) echo "Failed to update $MCP_FILE (helper exit $ADD_RC)." >&2; exit 1 ;;
esac

echo "Added MCP server '$SERVER_NAME' to $MCP_FILE."
echo "Diagnostic outputs will land in: $OUTPUT_HOST_DIR"
echo "Starting claude... (entry will be removed on exit)"
echo

claude
