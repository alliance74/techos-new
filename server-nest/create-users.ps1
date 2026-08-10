# Create Role Users for TechOS
Write-Host "`n🚀 Creating role users for TechOS..." -ForegroundColor Cyan

# CTO User
Write-Host "`nCreating CTO user..." -ForegroundColor Yellow
$ctoBody = '{"email":"cto@gmail.com","password":"Cto@2026","firstName":"Sarah","lastName":"Tech","role":"cto","organizationName":"TechOS Company"}'
try {
    Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $ctoBody -ContentType "application/json" | Out-Null
    Write-Host "✅ CTO user created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  CTO user already exists" -ForegroundColor Blue
}

# CISO User
Write-Host "Creating CISO user..." -ForegroundColor Yellow
$cisoBody = '{"email":"ciso@gmail.com","password":"Ciso@2026","firstName":"Michael","lastName":"Security","role":"ciso","organizationName":"TechOS Company"}'
try {
    Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $cisoBody -ContentType "application/json" | Out-Null
    Write-Host "✅ CISO user created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  CISO user already exists" -ForegroundColor Blue
}

# Finance User
Write-Host "Creating Finance user..." -ForegroundColor Yellow
$financeBody = '{"email":"finance@gmail.com","password":"Finance@2026","firstName":"Emma","lastName":"Money","role":"finance","organizationName":"TechOS Company"}'
try {
    Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $financeBody -ContentType "application/json" | Out-Null
    Write-Host "✅ Finance user created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Finance user already exists" -ForegroundColor Blue
}

Write-Host "`n🎉 Done!" -ForegroundColor Green
Write-Host "`n📝 Login Credentials:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "CEO:      ceo@gmail.com      / Ceo@2026" -ForegroundColor White
Write-Host "CTO:      cto@gmail.com      / Cto@2026" -ForegroundColor White
Write-Host "CISO:     ciso@gmail.com     / Ciso@2026" -ForegroundColor White
Write-Host "FINANCE:  finance@gmail.com  / Finance@2026" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n🌐 Login at: http://localhost:3000`n" -ForegroundColor Cyan
