param(
    [string]$Tag = "ravendb-support-mcp:latest"
)

docker build -t $Tag .
