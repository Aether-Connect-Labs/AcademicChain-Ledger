# Set config home to avoid permission issues
$env:XDG_CONFIG_HOME = "C:\Users\Alumno.LAPTOP-72MR2U1M\AcademicChain-Ledger\.config"

$workerUrl = "https://academicchain-worker.aether-connect-labs.workers.dev"

Write-Host "Verifying Reputation Endpoint..."
try {
    $response = Invoke-RestMethod -Uri "$workerUrl/api/institution/inst-1/reputation" -Method Get
    Write-Host "Success: $($response.success)"
    Write-Host "Institution ID: $($response.institutionId)"
    Write-Host "Metrics:"
    $response.metrics | Format-List
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
