import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(user.org_id, user.id, createDocumentDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata?: any,
  ) {
    return this.documentsService.uploadFile(user.org_id, user.id, file, metadata);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file'))
  attachFile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.attachFile(id, user.org_id, file);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.documentsService.findAll(user.org_id, filters);
  }

  @Get('search')
  search(@CurrentUser() user: any, @Query('q') query: string) {
    return this.documentsService.search(user.org_id, query);
  }

  @Get('folders')
  getFolders(@CurrentUser() user: any) {
    return this.documentsService.getFolders(user.org_id);
  }

  @Post('folders')
  createFolder(
    @CurrentUser() user: any,
    @Body() body: { name: string; parent_folder_id?: string },
  ) {
    return this.documentsService.createFolder(user.org_id, user.id, body);
  }

  @Get(':id/file')
  async getFile(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.documentsService.resolveFile(id, user.org_id);

    if (file.kind === 'remote') {
      return res.redirect(file.url);
    }

    const safeName = file.filename.replace(/"/g, '');
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    if (file.size != null) {
      res.setHeader('Content-Length', String(file.size));
    }
    return file.stream.pipe(res);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.documentsService.update(id, user.org_id, updateData);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.remove(id, user.org_id);
  }

  @Put(':id/archive')
  archive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.archive(id, user.org_id);
  }

  @Post(':id/versions')
  createVersion(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.documentsService.createVersion(id, user.org_id, user.id, body.content);
  }

  @Get(':id/versions')
  getVersions(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documentsService.getVersions(id, user.org_id);
  }
}
