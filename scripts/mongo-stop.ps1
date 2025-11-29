param(
  [string]$Name = "mongo-academicchain"
)
docker stop $Name 2>$null | Out-Null
docker rm $Name 2>$null | Out-Null
Write-Output ("MongoDB container stopped and removed: " + $Name)
