$env:XDG_CONFIG_HOME = "C:\Users\Alumno.LAPTOP-72MR2U1M\AcademicChain-Ledger\.config"
if (!(Test-Path $env:XDG_CONFIG_HOME)) {
    New-Item -ItemType Directory -Force -Path $env:XDG_CONFIG_HOME | Out-Null
}

Push-Location worker
Write-Host "Deploying Worker from $(Get-Location)..."
# Use wrangler.toml configuration and disable autoconfig to avoid Pages warning
# Also, pipe "y" to it just in case it asks
echo "y" | npx wrangler deploy --config wrangler.toml
Pop-Location
