import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { Document } from '../../entities/document.entity';
import { User } from '../../entities/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class DocumentsService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads', 'documents');

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private cloudinaryService: CloudinaryService,
  ) {}

  private ensureDir(dir: string) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private saveLocalFile(org_id: string, documentId: string, file: Express.Multer.File) {
    const orgDir = join(this.uploadsRoot, org_id);
    this.ensureDir(orgDir);
    const ext = extname(file.originalname || '') || '';
    const relative = join(org_id, `${documentId}${ext}`).replace(/\\/g, '/');
    const absolute = join(this.uploadsRoot, relative);
    writeFileSync(absolute, file.buffer);
    return relative;
  }

  private toFileDto(document: Document) {
    const remote =
      typeof document.content === 'string' && /^https?:\/\//i.test(document.content)
        ? document.content
        : null;
    const can_view = Boolean(remote || document.storage_path);
    return {
      ...document,
      file_url: remote || (document.storage_path ? `/documents/${document.id}/file` : document.content),
      file_type: document.file_mime || undefined,
      file_size: document.file_size ?? undefined,
      can_view,
    };
  }

  async create(org_id: string, user_id: string, createDocumentDto: CreateDocumentDto) {
    const document = this.documentsRepository.create({
      id: randomUUID(),
      org_id,
      title: createDocumentDto.title,
      content: createDocumentDto.content || '',
      type: createDocumentDto.type || 'general',
      folder: createDocumentDto.folder,
      tags: createDocumentDto.tags,
      created_by: user_id,
      version: 1,
    });

    await this.documentsRepository.save(document);

    return {
      success: true,
      data: this.toFileDto(document),
    };
  }

  async uploadFile(org_id: string, user_id: string, file: Express.Multer.File, metadata?: any) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const id = randomUUID();
    const storage_path = this.saveLocalFile(org_id, id, file);
    let fileUrl = `local://${storage_path}`;
    const fileType = file.mimetype || 'application/octet-stream';

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(file, `techos/${org_id}/documents`);
      if (uploadResult?.secure_url) {
        fileUrl = uploadResult.secure_url;
      }
    } catch {
      // Local file remains viewable when Cloudinary is unavailable.
    }

    const relatedType = metadata?.related_entity_type || metadata?.relatedEntityType;
    const relatedId = metadata?.related_entity_id || metadata?.relatedEntityId;
    const folder =
      metadata?.folder ||
      (relatedType && relatedId ? `related/${relatedType}/${relatedId}` : undefined);

    const tags = [
      ...(Array.isArray(metadata?.tags) ? metadata.tags : []),
      relatedType ? `related:${relatedType}` : null,
      relatedId ? `parent:${relatedId}` : null,
    ].filter(Boolean) as string[];

    const document = this.documentsRepository.create({
      id,
      org_id,
      title: metadata?.title || file.originalname,
      content: fileUrl,
      type: metadata?.type || 'file',
      folder,
      tags,
      storage_path,
      file_mime: fileType,
      file_size: file.size,
      created_by: user_id,
      version: 1,
    });

    await this.documentsRepository.save(document);

    return {
      success: true,
      data: this.toFileDto(document),
    };
  }

  /** Attach / replace the binary file on an existing document record. */
  async attachFile(id: string, org_id: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const document = await this.documentsRepository.findOne({ where: { id, org_id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Remove previous local blob if present
    if (document.storage_path) {
      const previous = join(this.uploadsRoot, document.storage_path);
      if (existsSync(previous)) {
        try {
          unlinkSync(previous);
        } catch {
          /* ignore */
        }
      }
    }

    const storage_path = this.saveLocalFile(org_id, id, file);
    let fileUrl = `local://${storage_path}`;
    const fileType = file.mimetype || 'application/octet-stream';

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(file, `techos/${org_id}/documents`);
      if (uploadResult?.secure_url) {
        fileUrl = uploadResult.secure_url;
      }
    } catch {
      /* keep local */
    }

    document.content = fileUrl;
    document.storage_path = storage_path;
    document.file_mime = fileType;
    document.file_size = file.size;
    document.type = document.type === 'folder' ? 'file' : document.type || 'file';
    if (!document.title || document.title === 'Untitled') {
      document.title = file.originalname;
    }
    document.version = (document.version || 1) + 1;

    await this.documentsRepository.save(document);

    return {
      success: true,
      data: this.toFileDto(document),
    };
  }

  /**
   * Resolve a document for inline viewing / download.
   * Prefers local disk; falls back to remote URL redirect.
   */
  async resolveFile(id: string, org_id: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const filename = document.title || 'file';
    const candidates: string[] = [];

    if (document.storage_path) {
      candidates.push(join(this.uploadsRoot, document.storage_path));
      // Also try absolute if storage_path was saved that way
      if (/^[a-zA-Z]:[\\/]|^\\\\|^\//.test(document.storage_path)) {
        candidates.push(document.storage_path);
      }
    }

    if (typeof document.content === 'string') {
      const localMatch = document.content.match(/^local:\/\/(.+)$/i);
      if (localMatch?.[1]) {
        candidates.push(join(this.uploadsRoot, localMatch[1]));
      }
    }

    for (const absolute of candidates) {
      if (absolute && existsSync(absolute)) {
        return {
          kind: 'local' as const,
          stream: createReadStream(absolute),
          mime: document.file_mime || 'application/octet-stream',
          filename,
          size: document.file_size ?? undefined,
        };
      }
    }

    if (typeof document.content === 'string' && /^https?:\/\//i.test(document.content)) {
      return {
        kind: 'remote' as const,
        url: document.content,
        mime: document.file_mime || 'application/octet-stream',
        filename,
      };
    }

    throw new NotFoundException(
      'File content is not available. Upload the file again from the document page.',
    );
  }

  async findAll(org_id: string, filters?: any) {
    const where: any = { org_id, is_archived: false };

    if (filters?.type) {
      where.type = filters.type;
    }

    const folderFilter = filters?.folder || filters?.folder_id;
    if (folderFilter) {
      where.folder = folderFilter;
    }

    const documents = await this.documentsRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    const creatorIds = [...new Set(documents.map((d) => d.created_by).filter(Boolean))];
    const creators = creatorIds.length
      ? await this.usersRepository.find({ where: { id: In(creatorIds) as any } })
      : [];
    const byId = Object.fromEntries(
      creators.map((u) => [
        u.id,
        u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || null,
      ]),
    );

    return {
      success: true,
      data: documents.map((d) => ({
        ...this.toFileDto(d),
        created_by_name: d.created_by ? byId[d.created_by] || null : null,
        owner: d.created_by ? byId[d.created_by] || '—' : '—',
      })),
    };
  }

  async findOne(id: string, org_id: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Avoid varchar=uuid SQL joins: documents.created_by is varchar; users.id is uuid.
    let created_by_first_name: string | null = null;
    let created_by_last_name: string | null = null;
    let created_by_name: string | null = null;
    if (document.created_by) {
      const creator = await this.usersRepository.findOne({
        where: { id: document.created_by },
      });
      if (creator) {
        created_by_first_name = creator.first_name || null;
        created_by_last_name = creator.last_name || null;
        created_by_name =
          creator.name ||
          `${creator.first_name || ''} ${creator.last_name || ''}`.trim() ||
          creator.email ||
          null;
      }
    }

    return {
      success: true,
      data: {
        ...this.toFileDto(document),
        created_by_first_name,
        created_by_last_name,
        created_by_name,
        owner: created_by_name || '—',
      },
    };
  }

  async update(id: string, org_id: string, updateData: Partial<Document>) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    Object.assign(document, updateData);
    await this.documentsRepository.save(document);

    return {
      success: true,
      data: document,
    };
  }

  async remove(id: string, org_id: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.storage_path) {
      const absolute = join(this.uploadsRoot, document.storage_path);
      if (existsSync(absolute)) {
        try {
          unlinkSync(absolute);
        } catch {
          // Ignore cleanup failures; DB row still removed.
        }
      }
    }

    await this.documentsRepository.remove(document);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async archive(id: string, org_id: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.is_archived = true;
    await this.documentsRepository.save(document);

    return {
      success: true,
      message: 'Document archived successfully',
    };
  }

  async search(org_id: string, query: string) {
    const documents = await this.documentsRepository
      .createQueryBuilder('document')
      .where('document.org_id = :org_id', { org_id })
      .andWhere('document.is_archived = :is_archived', { is_archived: false })
      .andWhere(
        '(document.title LIKE :query OR document.content LIKE :query OR document.tags LIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('document.updated_at', 'DESC')
      .limit(50)
      .getMany();

    return {
      success: true,
      data: documents,
    };
  }

  async getFolders(org_id: string) {
    const folders = await this.documentsRepository
      .createQueryBuilder('document')
      .select('document.folder', 'folder')
      .addSelect('COUNT(*)', 'document_count')
      .where('document.org_id = :org_id', { org_id })
      .andWhere('document.folder IS NOT NULL')
      .andWhere('document.is_archived = :is_archived', { is_archived: false })
      .groupBy('document.folder')
      .getRawMany();

    return {
      success: true,
      data: folders,
    };
  }

  async createVersion(id: string, org_id: string, user_id: string, content: string) {
    const document = await this.documentsRepository.findOne({
      where: { id, org_id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Create new version
    const newVersion = this.documentsRepository.create({
      id: randomUUID(),
      org_id,
      title: `${document.title} (v${document.version + 1})`,
      content,
      type: document.type,
      folder: document.folder,
      tags: document.tags,
      created_by: user_id,
      version: document.version + 1,
    });

    await this.documentsRepository.save(newVersion);

    // Update original document version number
    document.version += 1;
    await this.documentsRepository.save(document);

    return {
      success: true,
      data: newVersion,
    };
  }

  async getVersions(id: string, org_id: string) {
    const document = await this.documentsRepository.findOne({ where: { id, org_id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const baseTitle = document.title.replace(/\s\(v\d+\)$/, '');
    const versions = await this.documentsRepository
      .createQueryBuilder('document')
      .where('document.org_id = :org_id', { org_id })
      .andWhere('(document.id = :id OR document.title LIKE :title)', {
        id,
        title: `${baseTitle} (v%)`,
      })
      .orderBy('document.version', 'DESC')
      .getMany();

    return { success: true, data: versions };
  }

  async createFolder(org_id: string, user_id: string, folderData: { name: string; parent_folder_id?: string }) {
    const folderName = folderData.parent_folder_id
      ? `${folderData.parent_folder_id}/${folderData.name}`
      : folderData.name;

    const marker = this.documentsRepository.create({
      id: randomUUID(),
      org_id,
      title: `${folderData.name} (folder)`,
      content: '',
      type: 'folder',
      folder: folderName,
      created_by: user_id,
      version: 1,
    });

    await this.documentsRepository.save(marker);
    return { success: true, data: { name: folderName } };
  }
}
