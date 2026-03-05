# Set config home to avoid permission issues
$env:XDG_CONFIG_HOME = "C:\Users\Alumno.LAPTOP-72MR2U1M\AcademicChain-Ledger\.config"

$workerUrl = "https://academicchain-worker.aether-connect-labs.workers.dev"

Write-Host "Verifying Multiple Issuance..."
$payload = @{
    candidates = @(
        @{
            name = "Estudiante Multi 1"
            studentId = "MULTI-2026-001"
        },
        @{
            name = "Estudiante Multi 2"
            studentId = "MULTI-2026-002"
        }
    )
    degree = "Ingeniería de Sistemas"
    major = "Desarrollo Web"
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$workerUrl/api/universities/execute-issuance" -Method Post -Body $payload -ContentType "application/json"
    Write-Host "Success: $($response.success)"
    Write-Host "Message: $($response.message)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`nChecking D1 for records..."
Push-Location worker
npx wrangler d1 execute academic-db --command "SELECT * FROM certificates WHERE student_id LIKE 'MULTI-%'" --remote
Pop-Location
