import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';
import { ActivityLogService } from '../../common/services/activity-log.service';
import {
  assertCanViewProject,
  canViewProject,
  ProjectViewer,
} from '../../common/utils/project-visibility';
import { assertDeliveryAdmin } from '../../common/utils/org-admin';
import { NotificationsService } from '../notifications/notifications.service';

function normalizeAssigneeFields(dto: any): { assignee_id: string | null; assignee_ids: string[] } {
  const fromArray: string[] = Array.isArray(dto?.assignee_ids)
    ? dto.assignee_ids.filter((id: unknown): id is string => typeof id === 'string' && !!id.trim())
    : [];
  const fromSingle: string[] =
    dto?.assignee_id && typeof dto.assignee_id === 'string' && dto.assignee_id.trim()
      ? [dto.assignee_id]
      : [];
  const ids = [...new Set(fromArray.length ? fromArray : fromSingle)];
  return {
    assignee_ids: ids,
    assignee_id: ids[0] ?? null,
  };
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
    private notificationsService: NotificationsService,
  ) {}

  private async getAccessibleProjectIds(org_id: string, user?: ProjectViewer): Promise<string[]> {
    const projects = await this.projectsRepository.find({ where: { org_id } });
    return projects.filter((p) => canViewProject(p, user)).map((p) => p.id);
  }

  private async assertProjectAccess(project_id: string, org_id: string, user?: ProjectViewer) {
    const project = await this.projectsRepository.findOne({ where: { id: project_id, org_id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    assertCanViewProject(project, user);
    return project;
  }

  async create(org_id: string, actor: any, createTaskDto: any) {
    assertDeliveryAdmin(actor, 'create tasks');
    await this.assertProjectAccess(createTaskDto.project_id, org_id, actor);

    const { assignee_id, assignee_ids } = normalizeAssigneeFields(createTaskDto);

    const task = this.tasksRepository.create({
      id: randomUUID(),
      org_id,
      title: createTaskDto.title,
      description: createTaskDto.description,
      project_id: createTaskDto.project_id,
      sprint_id: createTaskDto.sprint_id,
      parent_task_id: createTaskDto.parent_task_id,
      status: createTaskDto.status || 'todo',
      priority: createTaskDto.priority || 'medium',
      assignee_id: assignee_id || undefined,
      assignee_ids: assignee_ids.length ? assignee_ids : undefined,
      estimated_hours: createTaskDto.estimated_hours,
      story_points: createTaskDto.story_points,
      due_date: createTaskDto.due_date,
      tags: createTaskDto.tags,
      reporter_id: actor?.id,
    } as Partial<Task>);

    const saved = await this.tasksRepository.save(task);
    
    if (saved.assignee_ids && saved.assignee_ids.length > 0) {
      const project = await this.projectsRepository.findOne({ where: { id: saved.project_id } });
      const projectName = project?.name || 'Unknown Project';
      
      for (const id of saved.assignee_ids) {
        if (id !== actor?.id) {
          await this.notificationsService.notifyTaskAssigned(
            saved.id,
            saved.title,
            id,
            projectName,
            org_id
          );
        }
      }
    }
    
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'tasks',
      resource_id: saved.id,
      summary: `created task "${saved.title || 'Untitled'}"`,
    });
    return { success: true, data: await this.enrichTask(saved) };
  }

  private parseAssigneeIds(task: any): string[] {
    let ids: string[] = [];
    const raw = task?.assignee_ids;
    if (Array.isArray(raw)) {
      ids = raw.filter(Boolean);
    } else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) ids = parsed.filter(Boolean);
      } catch {
        /* ignore */
      }
    }
    if (!ids.length && task?.assignee_id) ids = [task.assignee_id];
    return [...new Set(ids)];
  }

  private async enrichTasks(tasks: any[]) {
    const allIds = [
      ...new Set(tasks.flatMap((t) => this.parseAssigneeIds(t))),
    ];
    if (!allIds.length) {
      return tasks.map((t) => ({
        ...t,
        assignee_ids: [],
        assignee_name: null,
        assignees: [],
      }));
    }
    const users = await this.usersRepository.find({ where: { id: In(allIds) } });
    const byId = Object.fromEntries(
      users.map((u) => [
        u.id,
        {
          id: u.id,
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        },
      ]),
    );
    return tasks.map((t) => {
      const ids = this.parseAssigneeIds(t);
      const assignees = ids.map((id) => byId[id]).filter(Boolean);
      return {
        ...t,
        assignee_ids: ids,
        assignee_id: ids[0] || t.assignee_id || null,
        assignee_name: assignees[0]?.name || null,
        assignees,
      };
    });
  }

  private async enrichTask(task: any) {
    const [enriched] = await this.enrichTasks([task]);
    return enriched;
  }

  async findAll(org_id: string, filters?: any, user?: ProjectViewer) {
    const allowedIds = await this.getAccessibleProjectIds(org_id, user);
    if (!allowedIds.length) {
      return { success: true, data: [] };
    }

    if (filters?.project_id) {
      await this.assertProjectAccess(filters.project_id, org_id, user);
    }

    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('project.org_id = :org_id', { org_id })
      .andWhere('task.project_id IN (:...allowedIds)', { allowedIds });

    if (filters?.project_id) {
      queryBuilder.andWhere('task.project_id = :project_id', { project_id: filters.project_id });
    }
    if (filters?.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.assignee_id) {
      queryBuilder.andWhere(
        '(task.assignee_id = :assignee_id OR task.assignee_ids LIKE :assignee_like)',
        {
          assignee_id: filters.assignee_id,
          assignee_like: `%${filters.assignee_id}%`,
        },
      );
    }
    if (filters?.sprint_id === 'null' || filters?.sprint_id === 'none') {
      queryBuilder.andWhere('task.sprint_id IS NULL');
    } else if (filters?.sprint_id) {
      queryBuilder.andWhere('task.sprint_id = :sprint_id', { sprint_id: filters.sprint_id });
    }

    const tasks = await queryBuilder.select('task.*').orderBy('task.created_at', 'DESC').getRawMany();
    return { success: true, data: await this.enrichTasks(tasks) };
  }

  async findOne(id: string, org_id: string, user?: ProjectViewer) {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('task.id = :id', { id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('task.*')
      .getRawOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.assertProjectAccess(task.project_id, org_id, user);
    return { success: true, data: await this.enrichTask(task) };
  }

  async update(id: string, org_id: string, updateTaskDto: any, actor?: any) {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('task.id = :id', { id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('task.*')
      .getRawOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.assertProjectAccess(task.project_id, org_id, actor);

    const patch = { ...updateTaskDto };
    delete patch.id;
    delete patch.org_id;
    delete patch.created_at;
    delete patch.assignee_name;
    delete patch.assignees;
    delete patch.owner;
    delete patch.assignee;
    delete patch.statusVariant;
    delete patch.dueDate;
    delete patch.createdAt;
    delete patch.updatedAt;
    if (patch.sprint_id === '' || patch.sprint_id === 'null') {
      patch.sprint_id = null;
    }

    if (patch.project_id && patch.project_id !== task.project_id) {
      await this.assertProjectAccess(patch.project_id, org_id, actor);
    }

    if (patch.assignee_ids !== undefined || patch.assignee_id !== undefined) {
      if (Array.isArray(patch.assignee_ids)) {
        const ids = [
          ...new Set(
            patch.assignee_ids.filter((id: unknown) => typeof id === 'string' && id.trim()),
          ),
        ];
        patch.assignee_ids = ids.length ? ids : null;
        patch.assignee_id = ids[0] || null;
      } else if (patch.assignee_id === null || patch.assignee_id === '') {
        patch.assignee_id = null;
        patch.assignee_ids = null;
      } else {
        const normalized = normalizeAssigneeFields(patch);
        patch.assignee_id = normalized.assignee_id;
        patch.assignee_ids = normalized.assignee_ids.length ? normalized.assignee_ids : null;
      }
    }

    await this.tasksRepository.update(id, patch);
    const updated = await this.tasksRepository.findOne({ where: { id } });
    
    const project = await this.projectsRepository.findOne({ where: { id: updated?.project_id || task.project_id } });
    const projectName = project?.name || 'Unknown Project';

    // Notify new assignees
    if (updated?.assignee_ids) {
      const oldIds = task.assignee_ids || [];
      const newIds = updated.assignee_ids.filter(id => !oldIds.includes(id) && id !== actor?.id);
      
      for (const id of newIds) {
        await this.notificationsService.notifyTaskAssigned(
          updated.id,
          updated.title,
          id,
          projectName,
          org_id
        );
      }
    }

    // Notify assignees of status change
    if (updated && updated.status !== task.status && updated.assignee_ids) {
      for (const id of updated.assignee_ids) {
        if (id !== actor?.id) {
          await this.notificationsService.notifyTaskStatusChanged(
            updated.id,
            updated.title,
            id,
            updated.status,
            projectName,
            org_id
          );
        }
      }
    }
    
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'tasks',
      resource_id: id,
      summary: `updated task "${updated?.title || task.title || 'Untitled'}"`,
      changes: patch,
    });
    return { success: true, data: await this.enrichTask(updated) };
  }

  async remove(id: string, org_id: string, actor?: any) {
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('task.id = :id', { id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('task.*')
      .getRawOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.assertProjectAccess(task.project_id, org_id, actor);

    await this.tasksRepository.delete(id);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'deleted',
      resource_type: 'tasks',
      resource_id: id,
      summary: `deleted task "${task.title || 'Untitled'}"`,
    });
    return { success: true, message: 'Task deleted successfully' };
  }

  async getSubtasks(task_id: string, org_id: string, user?: ProjectViewer) {
    await this.findOne(task_id, org_id, user);
    const subtasks = await this.tasksRepository.find({
      where: { parent_task_id: task_id },
      order: { created_at: 'ASC' },
    });
    return { success: true, data: await this.enrichTasks(subtasks) };
  }
}
