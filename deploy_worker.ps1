Write-Host "Iniciando Despliegue de AcademicChain Worker..." -ForegroundColor Cyan
$env:WRANGLER_LOG = "none"

# 1. Check Wrangler Login
Write-Host "Verificando autenticacion de Cloudflare..." -ForegroundColor Yellow
try {
    $whoami = npx wrangler whoami 2>&1
    if ($whoami -match "not logged in" -or $whoami -match "Error") {
        Write-Host "No estas autenticado o el token expiro. Iniciando login..." -ForegroundColor Red
        Write-Host "Se abrira una ventana del navegador. Por favor autoriza a Wrangler."
        npx wrangler login
    } else {
        Write-Host "Autenticado correctamente." -ForegroundColor Green
    }
} catch {
    Write-Host "Error verificando auth. Intentando login..."
    npx wrangler login
}

# 2. Build & Deploy
Write-Host "Compilando y Desplegando..." -ForegroundColor Yellow
Set-Location worker
npm install
# Intentar deploy
npm run deploy

if ($?) {
    Write-Host "Despliegue Exitoso!" -ForegroundColor Green
    Write-Host "Verifica la integracion en tu dashboard de Cloudflare o accede a:" -ForegroundColor Cyan
    Write-Host "   /api/admin/verify-full-stack"
} else {
    Write-Host "Error en el despliegue. Revisa los logs arriba." -ForegroundColor Red
    Write-Host "Si el error es CLOUDFLARE_API_TOKEN, asegurate de haber hecho login."
}
