$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param($Uri, $Method = "GET", $Body = $null)
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = "application/json"
        }
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        $response = Invoke-RestMethod @params
        Write-Host "✅ $Method $Uri - Success" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "❌ $Method $Uri - Failed" -ForegroundColor Red
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host $reader.ReadToEnd()
        }
        return $null
    }
}

$baseUrl = "https://academicchain-worker.aether-connect-labs.workers.dev"

Write-Host "Testing Blockchain Status..."
Test-Endpoint "$baseUrl/api/status/blockchain"

Write-Host "`nTesting Employer Search..."
Test-Endpoint "$baseUrl/api/employer/search?q=Blockchain"

Write-Host "`nTesting Employer Verify..."
Test-Endpoint "$baseUrl/api/employer/verify" "POST" @{
    qrContent = "mock-qr-content"
    studentId = "mock-student-id"
}

Write-Host "`nTesting Smart CV Generation..."
$cvResponse = Test-Endpoint "$baseUrl/api/smart-cv/generate" "POST" @{
    specialization = "Blockchain Developer"
    technologies = @("Solidity", "React")
    achievement = "Built a DEX"
}

if ($cvResponse -and $cvResponse.cvData) {
    Write-Host "CV Data Received:"
    Write-Host "Profile: $($cvResponse.cvData.personalProfile)" -ForegroundColor Cyan
    Write-Host "Market Fit: $($cvResponse.cvData.marketFit)" -ForegroundColor Cyan
} else {
    Write-Host "CV Data missing or invalid" -ForegroundColor Yellow
}
