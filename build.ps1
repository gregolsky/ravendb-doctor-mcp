param(
    [string]$Tag = "ravendb-doctor-mcp:latest"
)

docker build -t $Tag .
