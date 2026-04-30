# One-time diagnostic session: registers ravendb-doctor MCP in .\.mcp.json,
# starts claude, then removes the entry on exit.
#
# Requires: docker, claude, and the ravendb-doctor-mcp:latest image.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $Cert,
  [Parameter(Mandatory = $true)] [string[]] $Url,
  [string] $Image = 'ravendb-doctor-mcp:latest'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Cert -PathType Leaf)) {
  Write-Error "PFX file not found: $Cert"
  exit 1
}

foreach ($cmd in @('docker', 'claude')) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "Required command missing: $cmd"
    exit 1
  }
}

$firstUrl = $Url[0]
$suffix = ($firstUrl -replace '^https?://', '' -replace '/.*$', '' -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLower()
if (-not $suffix) {
  Write-Error "Could not derive slug from URL: $firstUrl"
  exit 1
}
$serverName = "ravendb-doctor-$suffix"
$mcpFile = '.mcp.json'

$securePwd = Read-Host -Prompt 'PFX password (leave blank if none)' -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePwd)
try {
  $plainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$pfxBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($Cert))
$nodeUrls = ($Url -join ',')

$outputHostDir = Join-Path (Get-Location) "ravendb-mcp-output\$suffix"
New-Item -ItemType Directory -Force -Path $outputHostDir | Out-Null
$outputMount = ($outputHostDir -replace '\\', '/') + ':/data/output'

$createdFile = $false
if (Test-Path -LiteralPath $mcpFile) {
  $config = Get-Content -LiteralPath $mcpFile -Raw | ConvertFrom-Json
} else {
  $config = [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
  $createdFile = $true
}

if (-not $config.PSObject.Properties.Name.Contains('mcpServers') -or -not $config.mcpServers) {
  $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}

if ($config.mcpServers.PSObject.Properties.Name -contains $serverName) {
  Write-Error "MCP server '$serverName' already exists in $mcpFile - refusing to overwrite. Remove it first."
  exit 1
}

$entry = [pscustomobject]@{
  command = 'docker'
  args = @(
    'run', '-i', '--rm',
    '-v', $outputMount,
    '-e', 'RAVEN_NODE_URLS',
    '-e', 'RAVEN_CERT_PFX_BASE64',
    '-e', 'RAVEN_CERT_PASSWORD',
    $Image
  )
}

$config.mcpServers | Add-Member -NotePropertyName $serverName -NotePropertyValue $entry -Force
$config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $mcpFile -Encoding utf8

$env:RAVEN_NODE_URLS = $nodeUrls
$env:RAVEN_CERT_PFX_BASE64 = $pfxBase64
$env:RAVEN_CERT_PASSWORD = $plainPwd

Write-Host "Added MCP server '$serverName' to $mcpFile."
Write-Host "Diagnostic outputs will land in: $outputHostDir"
Write-Host "Starting claude... (entry will be removed on exit)"
Write-Host ''

try {
  & claude
} finally {
  if ($createdFile) {
    if (Test-Path -LiteralPath $mcpFile) { Remove-Item -LiteralPath $mcpFile -Force }
  } elseif (Test-Path -LiteralPath $mcpFile) {
    $cur = Get-Content -LiteralPath $mcpFile -Raw | ConvertFrom-Json
    if ($cur.mcpServers -and ($cur.mcpServers.PSObject.Properties.Name -contains $serverName)) {
      $cur.mcpServers.PSObject.Properties.Remove($serverName)
      $cur | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $mcpFile -Encoding utf8
    }
  }
  $env:RAVEN_NODE_URLS = $null
  $env:RAVEN_CERT_PFX_BASE64 = $null
  $env:RAVEN_CERT_PASSWORD = $null
  $plainPwd = $null
  $pfxBase64 = $null
}
