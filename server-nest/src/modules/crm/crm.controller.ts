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
import { CrmService } from './crm.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private crmService: CrmService) {}

  // Contacts
  @Post('contacts')
  createContact(@CurrentUser() user: any, @Body() createContactDto: CreateContactDto) {
    return this.crmService.createContact(user.org_id, createContactDto);
  }

  @Get('contacts')
  findAllContacts(@CurrentUser() user: any, @Query() filters: any) {
    return this.crmService.findAllContacts(user.org_id, filters);
  }

  @Get('contacts/:id')
  findOneContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.findOneContact(id, user.org_id);
  }

  @Put('contacts/:id')
  updateContact(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateContact(id, user.org_id, updateData);
  }

  @Delete('contacts/:id')
  deleteContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.deleteContact(id, user.org_id);
  }

  @Get('contacts/:id/score')
  scoreContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.scoreContact(id, user.org_id);
  }

  // Deals
  @Post('deals')
  createDeal(@CurrentUser() user: any, @Body() createDealDto: CreateDealDto) {
    return this.crmService.createDeal(user.org_id, createDealDto, user);
  }

  @Get('deals')
  findAllDeals(@CurrentUser() user: any, @Query() filters: any) {
    return this.crmService.findAllDeals(user.org_id, filters);
  }

  @Get('deals/:id')
  findOneDeal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.findOneDeal(id, user.org_id);
  }

  @Put('deals/:id')
  updateDeal(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.crmService.updateDeal(id, user.org_id, updateData, user);
  }

  @Delete('deals/:id')
  deleteDeal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.crmService.deleteDeal(id, user.org_id, user);
  }

  // Analytics
  @Get('pipeline/stats')
  getPipelineStats(@CurrentUser() user: any) {
    return this.crmService.getPipelineStats(user.org_id);
  }

  @Get('lead-scores')
  async getLeadScores(@CurrentUser() user: any) {
    const contacts = await this.crmService.findAllContacts(user.org_id);
    const scores = await Promise.all(
      (contacts.data || []).map((contact: any) => this.crmService.scoreContact(contact.id, user.org_id)),
    );
    return { success: true, data: scores.map((entry) => entry.data) };
  }

  @Post('lead-scores/:contactId/calculate')
  calculateLeadScore(@CurrentUser() user: any, @Param('contactId') contactId: string) {
    return this.crmService.scoreContact(contactId, user.org_id);
  }

  @Get('pipelines')
  getPipelines(@CurrentUser() user: any) {
    return this.crmService.getPipelineStats(user.org_id);
  }
}
