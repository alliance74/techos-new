# Comprehensive module generator for TechOS NestJS Backend

$moduleConfigs = @(
    @{Name="meetings"; Entity="Meeting"},
    @{Name="channels"; Entity="Channel"},
    @{Name="messages"; Entity="Message"},
    @{Name="crm"; Entity="Contact,Deal"; Endpoints=@("contacts", "deals")},
    @{Name="finance"; Entity="Invoice,Expense,Budget"; Endpoints=@("invoices", "expenses", "budgets")},
    @{Name="hr"; Entity="Employee,LeaveRequest"; Endpoints=@("employees", "leaves")},
    @{Name="documents"; Entity="Document"},
    @{Name="calendar"; Entity="CalendarEvent"},
    @{Name="notifications"; Entity="Notification"},
    @{Name="goals"; Entity="Goal"},
    @{Name="announcements"; Entity="Announcement"},
    @{Name="product"; Entity="Feature,Epic,Release,Bug,CustomerFeedback,Roadmap"; Endpoints=@("features", "epics", "releases", "bugs", "feedback", "roadmaps")},
    @{Name="analytics"; Entity=""},
    @{Name="dashboard"; Entity=""},
    @{Name="integrations"; Entity="Integration"},
    @{Name="ai"; Entity=""},
    @{Name="reports"; Entity="Report,KPI"}
)

foreach ($config in $moduleConfigs) {
    $moduleName = $config.Name
    $capitalizedName = (Get-Culture).TextInfo.ToTitleCase($moduleName)
    
    Write-Host "Generating $moduleName module..." -ForegroundColor Green
    
    # Create module file
    $moduleContent = @"
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${capitalizedName}Controller } from './$moduleName.controller';
import { ${capitalizedName}Service } from './$moduleName.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [${capitalizedName}Controller],
  providers: [${capitalizedName}Service],
  exports: [${capitalizedName}Service],
})
export class ${capitalizedName}Module {}
"@
    Set-Content -Path "src\modules\$moduleName\$moduleName.module.ts" -Value $moduleContent
    
    # Create service file
    $serviceContent = @"
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ${capitalizedName}Service {
  // TODO: Inject repositories and implement methods
  
  async create(org_id: string, createDto: any) {
    return { success: true, data: { message: 'Not implemented yet' } };
  }

  async findAll(org_id: string, filters?: any) {
    return { success: true, data: [] };
  }

  async findOne(id: string, org_id: string) {
    return { success: true, data: {} };
  }

  async update(id: string, org_id: string, updateDto: any) {
    return { success: true, data: {} };
  }

  async remove(id: string, org_id: string) {
    return { success: true, message: 'Deleted successfully' };
  }
}
"@
    Set-Content -Path "src\modules\$moduleName\$moduleName.service.ts" -Value $serviceContent
    
    # Create controller file
    $controllerContent = @"
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ${capitalizedName}Service } from './$moduleName.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('$moduleName')
@UseGuards(JwtAuthGuard)
export class ${capitalizedName}Controller {
  constructor(private ${moduleName}Service: ${capitalizedName}Service) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createDto: any) {
    return this.${moduleName}Service.create(user.org_id, createDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.${moduleName}Service.findAll(user.org_id, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.${moduleName}Service.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.${moduleName}Service.update(id, user.org_id, updateDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.${moduleName}Service.remove(id, user.org_id);
  }
}
"@
    Set-Content -Path "src\modules\$moduleName\$moduleName.controller.ts" -Value $controllerContent
}

Write-Host "`nAll modules generated successfully!" -ForegroundColor Cyan
Write-Host "Note: You'll need to add proper entity imports and implement the business logic." -ForegroundColor Yellow
