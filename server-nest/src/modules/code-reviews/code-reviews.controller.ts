import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CodeReviewsService } from './code-reviews.service';

@Controller('code-reviews')
@UseGuards(JwtAuthGuard)
export class CodeReviewsController {
  constructor(private readonly codeReviewsService: CodeReviewsService) {}

  @Post('preview-pr')
  previewPr(@CurrentUser() user: any, @Body() body: { pr_url?: string }) {
    return this.codeReviewsService.previewPr(user.org_id, body?.pr_url || '');
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.codeReviewsService.create(user.org_id, user, body);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.codeReviewsService.findAll(user.org_id, user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.codeReviewsService.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.codeReviewsService.update(id, user.org_id, user, body);
  }

  @Post(':id/decide')
  decide(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.codeReviewsService.decide(id, user.org_id, user, body?.status || '');
  }

  @Post(':id/sync')
  sync(@CurrentUser() user: any, @Param('id') id: string) {
    return this.codeReviewsService.syncFromPr(id, user.org_id, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.codeReviewsService.remove(id, user.org_id, user);
  }
}
