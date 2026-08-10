import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private hrService: HrService) {}

  // Employees
  @Post('employees')
  createEmployee(@CurrentUser() user: any, @Body() createEmployeeDto: CreateEmployeeDto) {
    return this.hrService.createEmployee(user.org_id, createEmployeeDto);
  }

  @Get('employees')
  findAllEmployees(@CurrentUser() user: any, @Query() filters: any) {
    return this.hrService.findAllEmployees(user.org_id, filters);
  }

  @Get('employee-activity/:id')
  getEmployeeActivity(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.getEmployeeActivity(id, user.org_id);
  }

  @Get('employees/:id')
  findOneEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneEmployee(id, user.org_id);
  }

  @Put('employees/:id')
  updateEmployee(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.hrService.updateEmployee(id, user.org_id, updateData, user);
  }

  @Delete('employees/:id')
  deleteEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deleteEmployee(id, user.org_id, user);
  }

  // Leave Requests
  @Post('leaves')
  createLeaveRequest(@CurrentUser() user: any, @Body() createLeaveRequestDto: CreateLeaveRequestDto) {
    return this.hrService.createLeaveRequest(user.org_id, user, createLeaveRequestDto);
  }

  @Get('leaves')
  findAllLeaveRequests(@CurrentUser() user: any, @Query() filters: any) {
    return this.hrService.findAllLeaveRequests(user.org_id, filters);
  }

  @Get('leaves/:id')
  findOneLeaveRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneLeaveRequest(id, user.org_id);
  }

  @Post('leaves/:id/approve')
  approveLeaveRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.approveLeaveRequest(id, user.org_id, user.id, user.role);
  }

  @Post('leaves/:id/reject')
  rejectLeaveRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { rejection_reason?: string },
  ) {
    return this.hrService.rejectLeaveRequest(id, user.org_id, user.id, user.role, body.rejection_reason);
  }

  @Delete('leaves/:id')
  deleteLeaveRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deleteLeaveRequest(id, user.org_id, user.id);
  }

  // Statistics
  @Get('stats')
  getHrStats(@CurrentUser() user: any) {
    return this.hrService.getHrStats(user.org_id);
  }
}
