$env:XDG_CONFIG_HOME = Join-Path $PSScriptRoot ".wrangler_home"
if (!(Test-Path $env:XDG_CONFIG_HOME)) { New-Item -ItemType Directory -Path $env:XDG_CONFIG_HOME -Force }
Set-Location "$PSScriptRoot\worker"
npx wrangler deploy