param(
  [int]$Port = 27017,
  [string]$Name = "mongo-academicchain"
)
$DataPath = Join-Path $env:USERPROFILE "AcademicChainMongoData"
if (!(Test-Path $DataPath)) { New-Item -ItemType Directory -Path $DataPath | Out-Null }
docker stop $Name 2>$null | Out-Null
docker rm $Name 2>$null | Out-Null
docker run -d --name $Name -p "$Port:27017" -v "$DataPath:/data/db" mongo:6
Write-Output ("MongoDB running on port " + $Port + ", data path: " + $DataPath)
