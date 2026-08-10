@echo off
echo.
echo Creating role users for TechOS...
echo.

echo Creating CTO user...
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"cto@gmail.com\",\"password\":\"Cto@2026\",\"firstName\":\"Sarah\",\"lastName\":\"Tech\",\"role\":\"cto\",\"organizationName\":\"TechOS Company\"}"
echo.

echo Creating CISO user...
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"ciso@gmail.com\",\"password\":\"Ciso@2026\",\"firstName\":\"Michael\",\"lastName\":\"Security\",\"role\":\"ciso\",\"organizationName\":\"TechOS Company\"}"
echo.

echo Creating Finance user...
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"finance@gmail.com\",\"password\":\"Finance@2026\",\"firstName\":\"Emma\",\"lastName\":\"Money\",\"role\":\"finance\",\"organizationName\":\"TechOS Company\"}"
echo.

echo.
echo ============================================
echo   Login Credentials
echo ============================================
echo CEO:      ceo@gmail.com      / Ceo@2026
echo CTO:      cto@gmail.com      / Cto@2026
echo CISO:     ciso@gmail.com     / Ciso@2026
echo FINANCE:  finance@gmail.com  / Finance@2026
echo ============================================
echo.
echo Login at: http://localhost:3000
echo.
