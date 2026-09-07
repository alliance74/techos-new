import { Controller, Get, Put, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUserByCeoDto } from './dto/create-user-by-ceo.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateMyPasswordDto } from './dto/update-my-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.org_id);
  }

  @Post()
  createByCeo(@CurrentUser() user: any, @Body() dto: CreateUserByCeoDto) {
    return this.usersService.createByCeo(user.org_id, user, dto);
  }

  @Put('me/profile')
  updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMyProfile(user.org_id, user.id, dto);
  }

  @Put('me/password')
  updateMyPassword(@CurrentUser() user: any, @Body() dto: UpdateMyPasswordDto) {
    return this.usersService.updateMyPassword(user.org_id, user.id, dto.currentPassword, dto.newPassword);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.findOne(id, user.org_id);
  }

  /** CEO can update any user record (name, role, status, department, etc.) */
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.usersService.update(id, user.org_id, user, updateData);
  }

  /** CEO can force-reset any user's password without knowing the old one */
  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.usersService.resetPasswordByCeo(id, actor.org_id, actor, body.password);
  }
}
