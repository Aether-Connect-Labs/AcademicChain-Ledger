$env:XDG_CONFIG_HOME = "C:\Users\Alumno.LAPTOP-72MR2U1M\AcademicChain-Ledger\.config"
if (!(Test-Path $env:XDG_CONFIG_HOME)) {
    New-Item -ItemType Directory -Force -Path $env:XDG_CONFIG_HOME | Out-Null
}

Push-Location worker
Write-Host "Deploying Worker..."
# Use wrangler.toml configuration
npx wrangler deploy --config wrangler.toml
Pop-Location
