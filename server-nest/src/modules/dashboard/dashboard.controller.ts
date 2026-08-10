import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('developer')
  getDeveloperDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getDeveloperDashboard(user.id, user.org_id, user.role);
  }

  @Get('executive')
  getExecutiveDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getExecutiveDashboard(user.org_id);
  }

  @Get('product')
  getProductDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getProductDashboard(user.org_id);
  }

  @Get('finance')
  getFinanceDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getFinanceDashboard(user.org_id);
  }

  @Get('hr')
  getHRDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getHRDashboard(user.org_id);
  }

  @Get('ciso')
  getCisoDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getCisoDashboard(user.org_id);
  }
}
