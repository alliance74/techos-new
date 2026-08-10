import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';
import {
  assertCanViewProject,
  canViewProject,
  parseProjectVisibleRoles,
} from '../../common/utils/project-visibility';

function normalizeVisibleRoles(roles?: string[] | null): string[] | null {
  if (!roles || !Array.isArray(roles)) return null;
  const cleaned = [
    ...new Set(
      roles
        .filter((r): r is string => typeof r === 'string' && !!r.trim())
        .map((r) => r.trim().toLowerCase()),
    ),
  ];
  if (!cleaned.length) return null;
  // CEO always retains visibility when a restriction is set
  if (!cleaned.includes('ceo')) cleaned.unshift('ceo');
  return cleaned;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private activityLogService: ActivityLogService,
  ) {}

  private assertCanView(project: Project, user?: { id?: string; role?: string } | null) {
    assertCanViewProject(project, user);
  }

  async create(org_id: string, actor: any, createProjectDto: CreateProjectDto) {
    const { client_name, visible_to_roles, ...rest } = createProjectDto;
    const project = this.projectsRepository.create({
      id: randomUUID(),
      org_id,
      name: rest.name,
      description: rest.description,
      priority: rest.priority || 'medium',
      start_date: rest.start_date,
      end_date: rest.end_date,
      budget: rest.budget,
      created_by: actor?.id,
      status: (rest.status || 'active').toLowerCase().replace(/\s+/g, '_'),
      visible_to_roles: normalizeVisibleRoles(visible_to_roles),
      metadata: client_name ? { client_name } : {},
    } as Partial<Project>);

    await this.projectsRepository.save(project);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'projects',
      resource_id: project.id,
      summary: `created project "${project.name || 'Untitled'}"`,
    });

    return {
      success: true,
      data: this.withProjectExtras(project),
    };
  }

  private timelineProgress(start_date?: string, end_date?: string): number {
    if (!start_date || !end_date) return 0;
    const start = new Date(start_date).getTime();
    const end = new Date(end_date).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }

  private withProjectExtras(project: Project) {
    const client_name = project.metadata?.client_name || null;
    const visible_to_roles = parseProjectVisibleRoles(project);
    return {
      ...project,
      client_name,
      owner_name: client_name,
      progress: this.timelineProgress(project.start_date, project.end_date),
      visible_to_roles,
      visibility:
        !visible_to_roles || visible_to_roles.length === 0
          ? 'all'
          : visible_to_roles.join(', '),
    };
  }

  async findAll(org_id: string, user?: { id?: string; role?: string } | null, status?: string) {
    const where: any = { org_id };
    if (status) {
      where.status = status;
    }

    const projects = await this.projectsRepository.find({ where });
    const visible = projects.filter((p) => canViewProject(p, user));

    const projectsWithCounts = await Promise.all(
      visible.map(async (project) => {
        const taskCount = await this.tasksRepository.count({
          where: { project_id: project.id },
        });
        const sprintCount = await this.sprintsRepository.count({
          where: { project_id: project.id },
        });

        return {
          ...this.withProjectExtras(project),
          task_count: taskCount,
          sprint_count: sprintCount,
        };
      }),
    );

    return {
      success: true,
      data: projectsWithCounts,
    };
  }

  async findOne(id: string, org_id: string, user?: { id?: string; role?: string } | null) {
    const project = await this.projectsRepository.findOne({
      where: { id, org_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertCanView(project, user);

    const sprints = await this.sprintsRepository.find({
      where: { project_id: id },
    });

    const tasks = await this.tasksRepository.find({
      where: { project_id: id },
    });

    return {
      success: true,
      data: {
        ...this.withProjectExtras(project),
        sprints,
        tasks,
      },
    };
  }

  async update(
    id: string,
    org_id: string,
    updateProjectDto: UpdateProjectDto,
    actor?: any,
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id, org_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertCanView(project, actor);

    const { client_name, visible_to_roles, ...rest } = updateProjectDto as UpdateProjectDto & {
      client_name?: string;
    };
    Object.assign(project, rest);
    if (client_name !== undefined) {
      project.metadata = { ...(project.metadata || {}), client_name };
    }
    if (visible_to_roles !== undefined) {
      project.visible_to_roles = normalizeVisibleRoles(visible_to_roles);
    }
    await this.projectsRepository.save(project);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'projects',
      resource_id: project.id,
      summary: `updated project "${project.name || 'Untitled'}"`,
      changes: updateProjectDto as any,
    });

    return {
      success: true,
      data: this.withProjectExtras(project),
    };
  }

  async remove(id: string, org_id: string, actor?: any) {
    const project = await this.projectsRepository.findOne({
      where: { id, org_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertCanView(project, actor);

    const name = project.name;
    await this.projectsRepository.remove(project);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'deleted',
      resource_type: 'projects',
      resource_id: id,
      summary: `deleted project "${name || 'Untitled'}"`,
    });

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  async getProjectStats(id: string, org_id: string, user?: { id?: string; role?: string } | null) {
    const project = await this.projectsRepository.findOne({
      where: { id, org_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    this.assertCanView(project, user);

    const tasks = await this.tasksRepository.find({
      where: { project_id: id },
    });

    const stats = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((t) => t.status === 'done').length,
      in_progress_tasks: tasks.filter((t) => t.status === 'in-progress' || t.status === 'in_progress').length,
      todo_tasks: tasks.filter((t) => t.status === 'todo').length,
      total_estimated_hours: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
      total_logged_hours: tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0),
    };

    return {
      success: true,
      data: stats,
    };
  }
}
