import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CodeReview, CodeReviewFile } from '../../entities/code-review.entity';
import { User } from '../../entities/user.entity';
import { Project } from '../../entities/project.entity';
import { Integration } from '../../entities/integration.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { PrImportService } from './pr-import.service';
import { canViewProject } from '../../common/utils/project-visibility';

function roleBasePath(role?: string) {
  const map: Record<string, string> = {
    ceo: '/ceo',
    cto: '/cto',
    ciso: '/ciso',
    finance: '/finance',
    software_engineer: '/software-engineer',
    ui_ux_designer: '/ui-ux-designer',
    customer_support: '/customer-support',
  };
  return map[String(role || '').toLowerCase()] || '/software-engineer';
}

function countPatchLines(patch?: string) {
  if (!patch) return { additions: 0, deletions: 0 };
  const additions = (patch.match(/^\+[^+]/gm) || []).length;
  const deletions = (patch.match(/^-[^-]/gm) || []).length;
  return { additions, deletions };
}

function normalizeFiles(files?: CodeReviewFile[] | null): CodeReviewFile[] {
  if (!Array.isArray(files)) return [];
  return files
    .filter((f) => f && typeof f.path === 'string' && f.path.trim())
    .map((f) => {
      const counted = countPatchLines(f.patch);
      return {
        path: f.path.trim(),
        patch: f.patch,
        status: f.status || 'modified',
        additions: f.additions ?? counted.additions,
        deletions: f.deletions ?? counted.deletions,
      };
    });
}

@Injectable()
export class CodeReviewsService {
  constructor(
    @InjectRepository(CodeReview)
    private reviewsRepository: Repository<CodeReview>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    private notificationsService: NotificationsService,
    private activityLogService: ActivityLogService,
    private prImportService: PrImportService,
  ) {}

  private userLabel(user?: User | null) {
    if (!user) return null;
    return (
      user.name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.email ||
      null
    );
  }

  private async enrich(reviews: CodeReview[]) {
    if (!reviews.length) return [];
    const userIds = [
      ...new Set(
        reviews.flatMap((r) => [r.author_id, r.reviewer_id].filter(Boolean) as string[]),
      ),
    ];
    const projectIds = [
      ...new Set(reviews.map((r) => r.project_id).filter(Boolean) as string[]),
    ];
    const [users, projects] = await Promise.all([
      userIds.length
        ? this.usersRepository.find({ where: { id: In(userIds) } })
        : Promise.resolve([] as User[]),
      projectIds.length
        ? this.projectsRepository.find({ where: { id: In(projectIds) } })
        : Promise.resolve([] as Project[]),
    ]);
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

    return reviews.map((r) => {
      const author = userMap[r.author_id];
      const reviewer = r.reviewer_id ? userMap[r.reviewer_id] : null;
      const project = r.project_id ? projectMap[r.project_id] : null;
      const files = normalizeFiles(r.files);
      const additions = files.reduce((s, f) => s + (f.additions || 0), 0);
      const deletions = files.reduce((s, f) => s + (f.deletions || 0), 0);
      return {
        ...r,
        files,
        author_name: this.userLabel(author),
        reviewer_name: this.userLabel(reviewer),
        project_name: project?.name || null,
        owner: this.userLabel(author) || '—',
        additions,
        deletions,
        file_count: files.length,
      };
    });
  }

  private async getIntegrationToken(org_id: string, type: string) {
    const row = await this.integrationsRepository.findOne({
      where: { org_id, type },
    });
    if (!row?.enabled) return null;
    return row.access_token || null;
  }

  async previewPr(org_id: string, pr_url: string) {
    if (!pr_url?.trim()) throw new BadRequestException('pr_url is required');
    const [github, gitlab] = await Promise.all([
      this.getIntegrationToken(org_id, 'github'),
      this.getIntegrationToken(org_id, 'gitlab'),
    ]);
    const imported = await this.prImportService.importFiles(pr_url.trim(), {
      github,
      gitlab,
    });
    return { success: true, data: imported };
  }

  async create(org_id: string, actor: any, dto: any) {
    if (!dto?.title?.trim()) throw new BadRequestException('Title is required');

    let files = normalizeFiles(dto.files);
    let importNote: string | undefined;

    if (dto.pr_url && !files.length) {
      const [github, gitlab] = await Promise.all([
        this.getIntegrationToken(org_id, 'github'),
        this.getIntegrationToken(org_id, 'gitlab'),
      ]);
      const imported = await this.prImportService.importFiles(dto.pr_url, { github, gitlab });
      files = imported.files;
      importNote = imported.message;
    }

    if (dto.project_id) {
      const project = await this.projectsRepository.findOne({
        where: { id: dto.project_id, org_id },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (!canViewProject(project, actor)) {
        throw new BadRequestException('You do not have access to this project');
      }
    }

    const review = this.reviewsRepository.create({
      id: randomUUID(),
      org_id,
      title: dto.title.trim(),
      description: dto.description || null,
      status: dto.status || 'open',
      priority: dto.priority || 'medium',
      project_id: dto.project_id || null,
      author_id: actor.id,
      reviewer_id: dto.reviewer_id || dto.owner || dto.owner_id || null,
      repository: dto.repository || null,
      branch: dto.branch || null,
      base_branch: dto.base_branch || 'main',
      pr_url: dto.pr_url || null,
      files,
      metadata: {
        ...(dto.metadata || {}),
        import_note: importNote || null,
      },
    });

    await this.reviewsRepository.save(review);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'codeReviews',
      resource_id: review.id,
      summary: `opened code review "${review.title}"`,
    });

    if (review.reviewer_id && review.reviewer_id !== actor.id) {
      const reviewer = await this.usersRepository.findOne({
        where: { id: review.reviewer_id },
      });
      const link = `${roleBasePath(reviewer?.role)}/code-reviews/${review.id}`;
      await this.notificationsService.create(org_id, {
        user_id: review.reviewer_id,
        type: 'code_review',
        title: 'Code review requested',
        message: `${this.userLabel(actor) || 'A teammate'} requested your review on "${review.title}"`,
        link,
        send_email: true,
        metadata: { code_review_id: review.id },
      });
    }

    const [enriched] = await this.enrich([review]);
    return {
      success: true,
      data: { ...enriched, import_note: importNote || null },
    };
  }

  async findAll(org_id: string, user?: { id?: string; role?: string }, filters?: any) {
    const where: any = { org_id };
    if (filters?.status) where.status = filters.status;
    if (filters?.project_id) where.project_id = filters.project_id;

    let reviews = await this.reviewsRepository.find({
      where,
      order: { updated_at: 'DESC' },
    });

    // Non-CEO: only reviews on invited projects (or no project), and involving them
    const role = String(user?.role || '').toLowerCase();
    if (role && role !== 'ceo') {
      const projects = await this.projectsRepository.find({ where: { org_id } });
      const allowed = new Set(
        projects.filter((p) => canViewProject(p, user)).map((p) => p.id),
      );
      reviews = reviews.filter((r) => {
        const projectOk = !r.project_id || allowed.has(r.project_id);
        const involved =
          r.author_id === user?.id ||
          r.reviewer_id === user?.id ||
          role === 'cto';
        return projectOk && involved;
      });
    }

    return { success: true, data: await this.enrich(reviews) };
  }

  async findOne(id: string, org_id: string) {
    const review = await this.reviewsRepository.findOne({ where: { id, org_id } });
    if (!review) throw new NotFoundException('Code review not found');
    const [enriched] = await this.enrich([review]);
    return { success: true, data: enriched };
  }

  async update(id: string, org_id: string, actor: any, dto: any) {
    const review = await this.reviewsRepository.findOne({ where: { id, org_id } });
    if (!review) throw new NotFoundException('Code review not found');

    const prevStatus = review.status;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.description !== undefined) review.description = dto.description;
    if (dto.status !== undefined) review.status = dto.status;
    if (dto.priority !== undefined) review.priority = dto.priority;
    if (dto.project_id !== undefined) review.project_id = dto.project_id;
    if (dto.reviewer_id !== undefined) review.reviewer_id = dto.reviewer_id;
    if (dto.repository !== undefined) review.repository = dto.repository;
    if (dto.branch !== undefined) review.branch = dto.branch;
    if (dto.base_branch !== undefined) review.base_branch = dto.base_branch;
    if (dto.pr_url !== undefined) review.pr_url = dto.pr_url;
    if (dto.files !== undefined) review.files = normalizeFiles(dto.files);

    await this.reviewsRepository.save(review);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'codeReviews',
      resource_id: review.id,
      summary: `updated code review "${review.title}"`,
      changes: dto,
    });

    if (
      dto.status &&
      dto.status !== prevStatus &&
      ['approved', 'changes_requested', 'merged'].includes(String(dto.status))
    ) {
      await this.notifyDecision(org_id, review, actor, String(dto.status));
    }

    const [enriched] = await this.enrich([review]);
    return { success: true, data: enriched };
  }

  async decide(id: string, org_id: string, actor: any, status: string) {
    if (!['approved', 'changes_requested', 'merged', 'closed'].includes(status)) {
      throw new BadRequestException('Invalid decision status');
    }
    return this.update(id, org_id, actor, { status });
  }

  private async notifyDecision(
    org_id: string,
    review: CodeReview,
    actor: any,
    status: string,
  ) {
    if (!review.author_id || review.author_id === actor?.id) return;
    const author = await this.usersRepository.findOne({ where: { id: review.author_id } });
    const link = `${roleBasePath(author?.role)}/code-reviews/${review.id}`;
    const label =
      status === 'approved'
        ? 'approved'
        : status === 'changes_requested'
          ? 'requested changes on'
          : `updated status to ${status} on`;
    await this.notificationsService.create(org_id, {
      user_id: review.author_id,
      type: 'code_review',
      title: 'Code review update',
      message: `${this.userLabel(actor) || 'A reviewer'} ${label} "${review.title}"`,
      link,
      send_email: true,
      metadata: { code_review_id: review.id, status },
    });
  }

  async syncFromPr(id: string, org_id: string, actor: any) {
    const review = await this.reviewsRepository.findOne({ where: { id, org_id } });
    if (!review) throw new NotFoundException('Code review not found');
    if (!review.pr_url) throw new BadRequestException('This review has no PR URL');

    const [github, gitlab] = await Promise.all([
      this.getIntegrationToken(org_id, 'github'),
      this.getIntegrationToken(org_id, 'gitlab'),
    ]);
    const imported = await this.prImportService.importFiles(review.pr_url, {
      github,
      gitlab,
    });
    if (!imported.files.length) {
      throw new BadRequestException(imported.message || 'No files imported from PR');
    }
    review.files = imported.files;
    review.metadata = {
      ...(review.metadata || {}),
      last_synced_at: new Date().toISOString(),
      import_note: imported.message || null,
      provider: imported.provider,
    };
    await this.reviewsRepository.save(review);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'codeReviews',
      resource_id: review.id,
      summary: `synced files from PR for "${review.title}"`,
    });
    const [enriched] = await this.enrich([review]);
    return { success: true, data: enriched };
  }

  async remove(id: string, org_id: string, actor?: any) {
    const review = await this.reviewsRepository.findOne({ where: { id, org_id } });
    if (!review) throw new NotFoundException('Code review not found');
    await this.reviewsRepository.remove(review);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'deleted',
      resource_type: 'codeReviews',
      resource_id: id,
      summary: `deleted code review "${review.title}"`,
    });
    return { success: true, message: 'Code review deleted' };
  }
}
