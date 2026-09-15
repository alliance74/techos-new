import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  // Public: List all organizations (for org picker)
  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  // Public: Find org by slug
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  // Authenticated: Get current user's organization
  @Get('current')
  @UseGuards(JwtAuthGuard)
  findCurrent(@CurrentUser() user: any) {
    return this.organizationsService.findOne(user.org_id);
  }

  // Authenticated: Get organization by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  // Authenticated: Create new organization
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: any) {
    return this.organizationsService.create(dto, user);
  }

  // Authenticated: Update organization (CEO only)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateData: any, @CurrentUser() user: any) {
    return this.organizationsService.update(id, updateData, user);
  }

  // Authenticated: Get organization members
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id);
  }

  // Authenticated: Join organization
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @CurrentUser() user: any) {
    return this.organizationsService.join(id, user.id);
  }
}
