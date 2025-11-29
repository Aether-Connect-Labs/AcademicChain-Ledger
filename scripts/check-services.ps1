param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [int]$MongoPort = 27017,
  [string]$MongoHost = "localhost"
)
$health = $null
$ready = $null
try { $health = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get -TimeoutSec 5 } catch {}
try { $ready = Invoke-RestMethod -Uri "$ApiBaseUrl/ready" -Method Get -TimeoutSec 5 } catch {}
$mongo = Test-NetConnection -ComputerName $MongoHost -Port $MongoPort
$apiHealth = if ($health) { "ok" } else { "fail" }
$apiReady = if ($ready) { "ok" } else { "fail" }
$mongoOk = if ($mongo.TcpTestSucceeded) { $true } else { $false }
$result = [pscustomobject]@{
  api = [pscustomobject]@{
    url = $ApiBaseUrl
    health = $apiHealth
    ready = $apiReady
  }
  mongo = [pscustomobject]@{
    host = $MongoHost
    port = $MongoPort
    ok = $mongoOk
  }
}
$result | ConvertTo-Json -Depth 4
