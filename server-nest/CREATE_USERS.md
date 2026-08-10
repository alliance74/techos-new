# Create Role Users - Instructions

Since the backend is already running on `http://localhost:4000`, you can create users by making HTTP requests to the `/auth/register` endpoint.

## Option 1: Using PowerShell (Automated)

Run this PowerShell script to create all users at once:

```powershell
# Create CTO user
$ctoBody = @{
    email = "cto@gmail.com"
    password = "Cto@2026"
    firstName = "Sarah"
    lastName = "Tech"
    role = "cto"
    organizationName = "TechOS Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $ctoBody -ContentType "application/json"

# Create CISO user
$cisoBody = @{
    email = "ciso@gmail.com"
    password = "Ciso@2026"
    firstName = "Michael"
    lastName = "Security"
    role = "ciso"
    organizationName = "TechOS Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $cisoBody -ContentType "application/json"

# Create Finance user
$financeBody = @{
    email = "finance@gmail.com"
    password = "Finance@2026"
    firstName = "Emma"
    lastName = "Money"
    role = "finance"
    organizationName = "TechOS Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/auth/register" -Method POST -Body $financeBody -ContentType "application/json"

Write-Host "`n✅ All users created successfully!" -ForegroundColor Green
Write-Host "`n📝 Login Credentials:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "CEO:      ceo@gmail.com      / Ceo@2026" -ForegroundColor White
Write-Host "CTO:      cto@gmail.com      / Cto@2026" -ForegroundColor White
Write-Host "CISO:     ciso@gmail.com     / Ciso@2026" -ForegroundColor White
Write-Host "FINANCE:  finance@gmail.com  / Finance@2026" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
```

## Option 2: Using curl (Manual)

### Create CTO User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"cto@gmail.com\",\"password\":\"Cto@2026\",\"firstName\":\"Sarah\",\"lastName\":\"Tech\",\"role\":\"cto\",\"organizationName\":\"TechOS Company\"}"
```

### Create CISO User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"ciso@gmail.com\",\"password\":\"Ciso@2026\",\"firstName\":\"Michael\",\"lastName\":\"Security\",\"role\":\"ciso\",\"organizationName\":\"TechOS Company\"}"
```

### Create Finance User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"finance@gmail.com\",\"password\":\"Finance@2026\",\"firstName\":\"Emma\",\"lastName\":\"Money\",\"role\":\"finance\",\"organizationName\":\"TechOS Company\"}"
```

## Login Credentials

| Role    | Email              | Password      |
|---------|-------------------|---------------|
| CEO     | ceo@gmail.com     | Ceo@2026      |
| CTO     | cto@gmail.com     | Cto@2026      |
| CISO    | ciso@gmail.com    | Ciso@2026     |
| FINANCE | finance@gmail.com | Finance@2026  |

## Testing

1. Go to `http://localhost:3000`
2. Click "Login"
3. Use any of the credentials above
4. You'll be redirected to the role-specific dashboard

## Notes

- All users belong to the same organization: "TechOS Company"
- All users have 'active' status
- Passwords follow the pattern: `[Role]@2026`
- Each user has a unique role assigned
