import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProductService } from './product.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private productService: ProductService) {}

  // ===================== FEATURES =====================
  @Post('features')
  createFeature(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createFeature(user.org_id, createDto);
  }

  @Get('features')
  findAllFeatures(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllFeatures(user.org_id, filters);
  }

  @Get('features/:id')
  findOneFeature(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneFeature(id, user.org_id);
  }

  @Put('features/:id')
  updateFeature(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateFeature(id, user.org_id, updateDto);
  }

  @Patch('features/:id/vote')
  voteFeature(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.voteFeature(id, user.org_id);
  }

  @Post('features/:id/vote')
  voteFeaturePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.voteFeature(id, user.org_id);
  }

  @Delete('features/:id')
  removeFeature(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeFeature(id, user.org_id);
  }

  // ===================== EPICS =====================
  @Post('epics')
  createEpic(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createEpic(user.org_id, createDto);
  }

  @Get('epics')
  findAllEpics(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllEpics(user.org_id, filters);
  }

  @Get('epics/:id')
  findOneEpic(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneEpic(id, user.org_id);
  }

  @Put('epics/:id')
  updateEpic(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateEpic(id, user.org_id, updateDto);
  }

  @Delete('epics/:id')
  removeEpic(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeEpic(id, user.org_id);
  }

  // ===================== BUGS =====================
  @Post('bugs')
  createBug(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createBug(user.org_id, user.id, createDto);
  }

  @Get('bugs')
  findAllBugs(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllBugs(user.org_id, filters, user);
  }

  @Get('bugs/:id')
  findOneBug(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneBug(id, user.org_id);
  }

  @Put('bugs/:id')
  updateBug(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateBug(id, user.org_id, updateDto);
  }

  @Delete('bugs/:id')
  removeBug(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeBug(id, user.org_id);
  }

  // ===================== RELEASES =====================
  @Post('releases')
  createRelease(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createRelease(user.org_id, createDto);
  }

  @Get('releases')
  findAllReleases(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllReleases(user.org_id, filters);
  }

  @Get('releases/:id')
  findOneRelease(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneRelease(id, user.org_id);
  }

  @Put('releases/:id')
  updateRelease(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateRelease(id, user.org_id, updateDto);
  }

  @Delete('releases/:id')
  removeRelease(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeRelease(id, user.org_id);
  }

  // ===================== FEEDBACK =====================
  @Post('feedback')
  createFeedback(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createFeedback(user.org_id, createDto);
  }

  @Get('feedback')
  findAllFeedback(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllFeedback(user.org_id, filters);
  }

  @Get('feedback/:id')
  findOneFeedback(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneFeedback(id, user.org_id);
  }

  @Put('feedback/:id')
  updateFeedback(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateFeedback(id, user.org_id, updateDto);
  }

  @Delete('feedback/:id')
  removeFeedback(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeFeedback(id, user.org_id);
  }

  // ===================== ROADMAPS =====================
  @Post('roadmaps')
  createRoadmap(@CurrentUser() user: any, @Body() createDto: any) {
    return this.productService.createRoadmap(user.org_id, createDto);
  }

  @Get('roadmaps')
  findAllRoadmaps(@CurrentUser() user: any, @Query() filters: any) {
    return this.productService.findAllRoadmaps(user.org_id, filters);
  }

  @Get('roadmaps/:id')
  findOneRoadmap(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.findOneRoadmap(id, user.org_id);
  }

  @Put('roadmaps/:id')
  updateRoadmap(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.productService.updateRoadmap(id, user.org_id, updateDto);
  }

  @Delete('roadmaps/:id')
  removeRoadmap(@CurrentUser() user: any, @Param('id') id: string) {
    return this.productService.removeRoadmap(id, user.org_id);
  }
}
