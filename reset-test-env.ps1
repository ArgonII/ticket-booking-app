
$ErrorActionPreference = "Stop"

$composeArgs = @(
    "--env-file", ".env.test",
    "-p", "ticket-booking-test"
)

Write-Host "Stopping test environment..."
docker compose @composeArgs down --volumes

if ($LASTEXITCODE -ne 0) {
    throw "Failed to stop test environment"
}

Write-Host "Starting clean test environment..."
docker compose @composeArgs up -d --build --wait

if ($LASTEXITCODE -ne 0) {
    throw "Failed to start test environment"
}

Write-Host "Test environment is ready!"
