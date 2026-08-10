import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Feature } from '../../entities/feature.entity';
import { Epic } from '../../entities/epic.entity';
import { Bug } from '../../entities/bug.entity';
import { Release } from '../../entities/release.entity';
import { CustomerFeedback } from '../../entities/customer-feedback.entity';
import { Roadmap } from '../../entities/roadmap.entity';
import { Project } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';
import { canViewProject } from '../../common/utils/project-visibility';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(Release)
    private releaseRepository: Repository<Release>,
    @InjectRepository(CustomerFeedback)
    private feedbackRepository: Repository<CustomerFeedback>,
    @InjectRepository(Roadmap)
    private roadmapRepository: Repository<Roadmap>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ===================== FEATURES =====================
  async createFeature(org_id: string, createDto: any) {
    const feature = this.featureRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: createDto.status || 'backlog',
      priority: createDto.priority || 'medium',
      votes: 0,
    });

    await this.featureRepository.save(feature);
    return { success: true, data: feature };
  }

  async findAllFeatures(org_id: string, filters?: any) {
    const query = this.featureRepository.createQueryBuilder('feature')
      .where('feature.org_id = :org_id', { org_id });

    if (filters?.status) query.andWhere('feature.status = :status', { status: filters.status });
    if (filters?.priority) query.andWhere('feature.priority = :priority', { priority: filters.priority });
    if (filters?.epic_id) query.andWhere('feature.epic_id = :epic_id', { epic_id: filters.epic_id });
    if (filters?.release_id) query.andWhere('feature.release_id = :release_id', { release_id: filters.release_id });

    query.orderBy('feature.votes', 'DESC').addOrderBy('feature.created_at', 'DESC');

    const features = await query.getMany();
    return { success: true, data: features };
  }

  async findOneFeature(id: string, org_id: string) {
    const feature = await this.featureRepository.findOne({ where: { id, org_id } });
    if (!feature) throw new NotFoundException('Feature not found');
    return { success: true, data: feature };
  }

  async updateFeature(id: string, org_id: string, updateDto: any) {
    const feature = await this.featureRepository.findOne({ where: { id, org_id } });
    if (!feature) throw new NotFoundException('Feature not found');

    Object.assign(feature, updateDto);
    await this.featureRepository.save(feature);
    return { success: true, data: feature };
  }

  async removeFeature(id: string, org_id: string) {
    const feature = await this.featureRepository.findOne({ where: { id, org_id } });
    if (!feature) throw new NotFoundException('Feature not found');

    await this.featureRepository.remove(feature);
    return { success: true, message: 'Feature deleted successfully' };
  }

  async voteFeature(id: string, org_id: string) {
    const feature = await this.featureRepository.findOne({ where: { id, org_id } });
    if (!feature) throw new NotFoundException('Feature not found');

    feature.votes += 1;
    await this.featureRepository.save(feature);
    return { success: true, data: feature };
  }

  // ===================== EPICS =====================
  async createEpic(org_id: string, createDto: any) {
    const epic = this.epicRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: createDto.status || 'planned',
      progress: 0,
    });

    await this.epicRepository.save(epic);
    return { success: true, data: epic };
  }

  async findAllEpics(org_id: string, filters?: any) {
    const query = this.epicRepository.createQueryBuilder('epic')
      .where('epic.org_id = :org_id', { org_id });

    if (filters?.status) query.andWhere('epic.status = :status', { status: filters.status });

    query.orderBy('epic.created_at', 'DESC');

    const epics = await query.getMany();
    return { success: true, data: epics };
  }

  async findOneEpic(id: string, org_id: string) {
    const epic = await this.epicRepository.findOne({ where: { id, org_id } });
    if (!epic) throw new NotFoundException('Epic not found');

    // Get associated features
    const features = await this.featureRepository.find({ where: { epic_id: id, org_id } });

    return { success: true, data: { ...epic, features } };
  }

  async updateEpic(id: string, org_id: string, updateDto: any) {
    const epic = await this.epicRepository.findOne({ where: { id, org_id } });
    if (!epic) throw new NotFoundException('Epic not found');

    Object.assign(epic, updateDto);
    await this.epicRepository.save(epic);
    return { success: true, data: epic };
  }

  async removeEpic(id: string, org_id: string) {
    const epic = await this.epicRepository.findOne({ where: { id, org_id } });
    if (!epic) throw new NotFoundException('Epic not found');

    await this.epicRepository.remove(epic);
    return { success: true, message: 'Epic deleted successfully' };
  }

  // ===================== BUGS =====================
  async createBug(org_id: string, reporter_id: string, createDto: any) {
    if (createDto.project_id) {
      const project = await this.projectRepository.findOne({
        where: { id: createDto.project_id, org_id },
      });
      if (!project) throw new NotFoundException('Project not found');
    }

    const bug = this.bugRepository.create({
      id: randomUUID(),
      org_id,
      reporter_id,
      title: createDto.title,
      description: createDto.description || createDto.steps_to_reproduce || createDto.title,
      status: createDto.status || 'open',
      severity: createDto.severity || createDto.priority || 'medium',
      priority: createDto.priority || createDto.severity || 'medium',
      project_id: createDto.project_id || null,
      assignee_id: createDto.assignee_id || null,
      steps_to_reproduce: createDto.steps_to_reproduce || null,
      expected_behavior: createDto.expected_behavior || null,
      actual_behavior: createDto.actual_behavior || null,
      environment: createDto.environment || null,
    });

    await this.bugRepository.save(bug);
    return { success: true, data: await this.enrichBug(bug) };
  }

  private async enrichBugs(bugs: Bug[]) {
    if (!bugs.length) return [];
    const projectIds = [...new Set(bugs.map((b) => b.project_id).filter(Boolean))] as string[];
    const userIds = [
      ...new Set(
        bugs.flatMap((b) => [b.assignee_id, b.reporter_id].filter(Boolean) as string[]),
      ),
    ];
    const [projects, users] = await Promise.all([
      projectIds.length
        ? this.projectRepository.find({ where: { id: In(projectIds) } })
        : Promise.resolve([] as Project[]),
      userIds.length
        ? this.userRepository.find({ where: { id: In(userIds) } })
        : Promise.resolve([] as User[]),
    ]);
    const projectName = Object.fromEntries(projects.map((p) => [p.id, p.name]));
    const userName = Object.fromEntries(
      users.map((u) => [
        u.id,
        u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      ]),
    );
    return bugs.map((b) => ({
      ...b,
      project_name: b.project_id ? projectName[b.project_id] || null : null,
      assignee_name: b.assignee_id ? userName[b.assignee_id] || null : null,
      reporter_name: b.reporter_id ? userName[b.reporter_id] || null : null,
    }));
  }

  private async enrichBug(bug: Bug) {
    const [enriched] = await this.enrichBugs([bug]);
    return enriched;
  }

  async findAllBugs(org_id: string, filters?: any, user?: { id?: string; role?: string }) {
    const query = this.bugRepository.createQueryBuilder('bug')
      .where('bug.org_id = :org_id', { org_id });

    if (filters?.status) query.andWhere('bug.status = :status', { status: filters.status });
    if (filters?.severity) query.andWhere('bug.severity = :severity', { severity: filters.severity });
    if (filters?.priority) query.andWhere('bug.priority = :priority', { priority: filters.priority });
    if (filters?.assignee_id) query.andWhere('bug.assignee_id = :assignee_id', { assignee_id: filters.assignee_id });
    if (filters?.project_id) query.andWhere('bug.project_id = :project_id', { project_id: filters.project_id });

    query.orderBy('bug.priority', 'DESC').addOrderBy('bug.created_at', 'DESC');

    let bugs = await query.getMany();

    // Non-CEO: only bugs on invited/open projects (and unassigned-to-project)
    const role = String(user?.role || '').toLowerCase();
    if (role && role !== 'ceo') {
      const projects = await this.projectRepository.find({ where: { org_id } });
      const allowed = new Set(
        projects.filter((p) => canViewProject(p, user)).map((p) => p.id),
      );
      bugs = bugs.filter((b) => !b.project_id || allowed.has(b.project_id));
    }

    return { success: true, data: await this.enrichBugs(bugs) };
  }

  async findOneBug(id: string, org_id: string) {
    const bug = await this.bugRepository.findOne({ where: { id, org_id } });
    if (!bug) throw new NotFoundException('Bug not found');
    return { success: true, data: await this.enrichBug(bug) };
  }

  async updateBug(id: string, org_id: string, updateDto: any) {
    const bug = await this.bugRepository.findOne({ where: { id, org_id } });
    if (!bug) throw new NotFoundException('Bug not found');

    Object.assign(bug, updateDto);
    await this.bugRepository.save(bug);
    return { success: true, data: bug };
  }

  async removeBug(id: string, org_id: string) {
    const bug = await this.bugRepository.findOne({ where: { id, org_id } });
    if (!bug) throw new NotFoundException('Bug not found');

    await this.bugRepository.remove(bug);
    return { success: true, message: 'Bug deleted successfully' };
  }

  // ===================== RELEASES =====================
  async createRelease(org_id: string, createDto: any) {
    const release = this.releaseRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: createDto.status || 'planned',
    });

    await this.releaseRepository.save(release);
    return { success: true, data: release };
  }

  async findAllReleases(org_id: string, filters?: any) {
    const query = this.releaseRepository.createQueryBuilder('release')
      .where('release.org_id = :org_id', { org_id });

    if (filters?.status) query.andWhere('release.status = :status', { status: filters.status });

    query.orderBy('release.release_date', 'DESC');

    const releases = await query.getMany();
    return { success: true, data: releases };
  }

  async findOneRelease(id: string, org_id: string) {
    const release = await this.releaseRepository.findOne({ where: { id, org_id } });
    if (!release) throw new NotFoundException('Release not found');

    // Get associated features
    const features = await this.featureRepository.find({ where: { release_id: id, org_id } });

    return { success: true, data: { ...release, features } };
  }

  async updateRelease(id: string, org_id: string, updateDto: any) {
    const release = await this.releaseRepository.findOne({ where: { id, org_id } });
    if (!release) throw new NotFoundException('Release not found');

    Object.assign(release, updateDto);
    await this.releaseRepository.save(release);
    return { success: true, data: release };
  }

  async removeRelease(id: string, org_id: string) {
    const release = await this.releaseRepository.findOne({ where: { id, org_id } });
    if (!release) throw new NotFoundException('Release not found');

    await this.releaseRepository.remove(release);
    return { success: true, message: 'Release deleted successfully' };
  }

  // ===================== FEEDBACK =====================
  async createFeedback(org_id: string, createDto: any) {
    const feedback = this.feedbackRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: createDto.status || 'new',
      type: createDto.type || 'feature_request',
    });

    await this.feedbackRepository.save(feedback);
    return { success: true, data: feedback };
  }

  async findAllFeedback(org_id: string, filters?: any) {
    const query = this.feedbackRepository.createQueryBuilder('feedback')
      .where('feedback.org_id = :org_id', { org_id });

    if (filters?.type) query.andWhere('feedback.type = :type', { type: filters.type });
    if (filters?.status) query.andWhere('feedback.status = :status', { status: filters.status });
    if (filters?.contact_id) query.andWhere('feedback.contact_id = :contact_id', { contact_id: filters.contact_id });

    query.orderBy('feedback.created_at', 'DESC');

    const feedbacks = await query.getMany();
    return { success: true, data: feedbacks };
  }

  async findOneFeedback(id: string, org_id: string) {
    const feedback = await this.feedbackRepository.findOne({ where: { id, org_id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return { success: true, data: feedback };
  }

  async updateFeedback(id: string, org_id: string, updateDto: any) {
    const feedback = await this.feedbackRepository.findOne({ where: { id, org_id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    Object.assign(feedback, updateDto);
    await this.feedbackRepository.save(feedback);
    return { success: true, data: feedback };
  }

  async removeFeedback(id: string, org_id: string) {
    const feedback = await this.feedbackRepository.findOne({ where: { id, org_id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    await this.feedbackRepository.remove(feedback);
    return { success: true, message: 'Feedback deleted successfully' };
  }

  // ===================== ROADMAPS =====================
  async createRoadmap(org_id: string, createDto: any) {
    const roadmap = this.roadmapRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: createDto.status || 'active',
      type: createDto.type || 'product',
      items: createDto.items || [],
    });

    await this.roadmapRepository.save(roadmap);
    return { success: true, data: roadmap };
  }

  async findAllRoadmaps(org_id: string, filters?: any) {
    const query = this.roadmapRepository.createQueryBuilder('roadmap')
      .where('roadmap.org_id = :org_id', { org_id });

    if (filters?.type) query.andWhere('roadmap.type = :type', { type: filters.type });
    if (filters?.status) query.andWhere('roadmap.status = :status', { status: filters.status });

    query.orderBy('roadmap.created_at', 'DESC');

    const roadmaps = await query.getMany();
    return { success: true, data: roadmaps };
  }

  async findOneRoadmap(id: string, org_id: string) {
    const roadmap = await this.roadmapRepository.findOne({ where: { id, org_id } });
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return { success: true, data: roadmap };
  }

  async updateRoadmap(id: string, org_id: string, updateDto: any) {
    const roadmap = await this.roadmapRepository.findOne({ where: { id, org_id } });
    if (!roadmap) throw new NotFoundException('Roadmap not found');

    Object.assign(roadmap, updateDto);
    await this.roadmapRepository.save(roadmap);
    return { success: true, data: roadmap };
  }

  async removeRoadmap(id: string, org_id: string) {
    const roadmap = await this.roadmapRepository.findOne({ where: { id, org_id } });
    if (!roadmap) throw new NotFoundException('Roadmap not found');

    await this.roadmapRepository.remove(roadmap);
    return { success: true, message: 'Roadmap deleted successfully' };
  }
}
