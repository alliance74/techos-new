import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get()
  findOne(@CurrentUser() user: any) {
    return this.organizationsService.findOne(user.org_id);
  }

  @Put()
  update(@CurrentUser() user: any, @Body() updateData: any) {
    return this.organizationsService.update(user.org_id, updateData);
  }
}
