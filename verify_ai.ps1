
$env:XDG_CONFIG_HOME = "C:\Users\Alumno.LAPTOP-72MR2U1M\AcademicChain-Ledger\.config"
$WorkerUrl = "https://academicchain-worker.aether-connect-labs.workers.dev"

Write-Host "1. Testing Smart CV Bot (Expect Mock or AI response)..."
$cvPayload = @{
    specialization = "Blockchain Developer"
    achievement = "Built a DeFi protocol"
    technologies = @("Solidity", "Rust", "React")
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$WorkerUrl/api/smart-cv/generate" -Method Post -Body $cvPayload -ContentType "application/json"
    if ($res.success) {
        Write-Host "✅ Smart CV Success"
        Write-Host "   Profile: $($res.cvData.personalProfile)"
        Write-Host "   Trust Score: $($res.cvData.trustScore)"
    } else {
        Write-Host "❌ Smart CV Failed: $($res.error)"
    }
} catch {
    Write-Host "❌ Error: $_"
}

Write-Host "`n2. Testing Support Bot..."
$chatPayload = @{
    message = "How can I verify a diploma?"
    history = @()
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$WorkerUrl/api/academic-chain-support" -Method Post -Body $chatPayload -ContentType "application/json"
    if ($res.output) {
        Write-Host "✅ Support Bot Success"
        Write-Host "   Response: $($res.output)"
    } else {
        Write-Host "❌ Support Bot Failed: $($res)"
    }
} catch {
    Write-Host "❌ Error: $_"
}
