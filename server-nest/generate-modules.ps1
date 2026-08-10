# PowerShell script to generate all remaining NestJS modules

$modules = @(
    "users",
    "organizations",
    "tasks",
    "sprints",
    "meetings",
    "channels",
    "messages",
    "crm",
    "finance",
    "hr",
    "documents",
    "calendar",
    "notifications",
    "goals",
    "announcements",
    "product",
    "analytics",
    "dashboard",
    "integrations",
    "ai",
    "reports"
)

foreach ($module in $modules) {
    Write-Host "Generating $module module..." -ForegroundColor Green
    
    # Create service file if it doesn't exist
    $servicePath = "src\modules\$module\$module.service.ts"
    if (-not (Test-Path $servicePath)) {
        $serviceContent = @"
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ${module}Service {
  // TODO: Implement service methods
}
"@
        New-Item -Path $servicePath -ItemType File -Force | Out-Null
        Set-Content -Path $servicePath -Value $serviceContent
    }
    
    # Create controller file if it doesn't exist
    $controllerPath = "src\modules\$module\$module.controller.ts"
    if (-not (Test-Path $controllerPath)) {
        $controllerContent = @"
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ${module}Service } from './$module.service';

@Controller('$module')
@UseGuards(JwtAuthGuard)
export class ${module}Controller {
  constructor(private ${module}Service: ${module}Service) {}
  
  // TODO: Implement controller methods
}
"@
        New-Item -Path $controllerPath -ItemType File -Force | Out-Null
        Set-Content -Path $controllerPath -Value $controllerContent
    }
}

Write-Host "Module generation complete!" -ForegroundColor Cyan
