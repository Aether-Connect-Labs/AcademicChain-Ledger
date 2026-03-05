$baseUrl = "https://academicchain-worker.aether-connect-labs.workers.dev"

function Test-Endpoint {
    param (
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Method -ne "GET" -and $Body.Count -gt 0) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error calling $Url : $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Response Body: $($reader.ReadToEnd())" -ForegroundColor Red
        }
        return $null
    }
}

# 1. Issue Credential
Write-Host "1. Testing Creator Issuance..." -ForegroundColor Cyan
$studentName = "Test Student $(Get-Date -Format 'HHmmss')"
$issuePayload = @{
    studentName = $studentName
    studentEmail = "test.$(Get-Date -Format 'HHmmss')@example.com"
    credentialType = "Blockchain Developer Certification"
    txId = "0.0.$(Get-Random -Minimum 100000 -Maximum 999999)"
}

$issueResult = Test-Endpoint "$baseUrl/api/creators/issue" "POST" $issuePayload

if ($issueResult -and $issueResult.success) {
    Write-Host "✅ Issuance Successful! ID: $($issueResult.data.id)" -ForegroundColor Green
} else {
    Write-Host "❌ Issuance Failed" -ForegroundColor Red
    exit
}

# 2. Verify in Employer Search
Write-Host "`n2. Testing Employer Search (Expect to find '$studentName')..." -ForegroundColor Cyan
Start-Sleep -Seconds 2 # Give D1 a moment to replicate/index if needed

$searchResult = Test-Endpoint "$baseUrl/api/employer/search?q=$studentName" "GET"

if ($searchResult -and $searchResult.success) {
    $found = $searchResult.candidates | Where-Object { $_.student_name -eq $studentName }
    if ($found) {
        Write-Host "✅ Found Candidate in Search Results!" -ForegroundColor Green
        Write-Host "   Name: $($found.student_name)"
        Write-Host "   Degree: $($found.degree)"
        Write-Host "   TX: $($found.blockchain_tx)"
    } else {
        Write-Host "❌ Candidate NOT found in search results." -ForegroundColor Red
        Write-Host "Candidates returned: $($searchResult.candidates.Count)"
    }
} else {
    Write-Host "❌ Search Failed" -ForegroundColor Red
}

# 3. Verify Empty Search (Recent)
Write-Host "`n3. Testing Empty Search (Recent Talents)..." -ForegroundColor Cyan
$recentResult = Test-Endpoint "$baseUrl/api/employer/search" "GET"

if ($recentResult -and $recentResult.success -and $recentResult.candidates.Count -gt 0) {
    Write-Host "✅ Recent Talents returned: $($recentResult.candidates.Count)" -ForegroundColor Green
} else {
    Write-Host "❌ Recent Search Failed or Empty" -ForegroundColor Red
}
