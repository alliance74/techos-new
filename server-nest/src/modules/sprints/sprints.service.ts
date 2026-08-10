import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Sprint } from '../../entities/sprint.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import {
  assertCanViewProject,
  canViewProject,
  ProjectViewer,
} from '../../common/utils/project-visibility';
import { assertDeliveryAdmin } from '../../common/utils/org-admin';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private sprintsRepository: Repository<Sprint>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
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

  async create(org_id: string, createSprintDto: any, user?: ProjectViewer) {
    assertDeliveryAdmin(user, 'create sprints');
    await this.assertProjectAccess(createSprintDto.project_id, org_id, user);

    const sprint = this.sprintsRepository.create({
      id: randomUUID(),
      org_id,
      project_id: createSprintDto.project_id,
      name: createSprintDto.name || createSprintDto.title,
      goal: createSprintDto.goal || createSprintDto.description || null,
      start_date: createSprintDto.start_date,
      end_date:
        createSprintDto.end_date ||
        createSprintDto.start_date ||
        new Date().toISOString().slice(0, 10),
      status: createSprintDto.status || 'planned',
    });

    await this.sprintsRepository.save(sprint);
    return { success: true, data: sprint };
  }

  async findAll(org_id: string, project_id?: string, user?: ProjectViewer) {
    const allowedIds = await this.getAccessibleProjectIds(org_id, user);
    if (!allowedIds.length) {
      return { success: true, data: [] };
    }

    if (project_id) {
      await this.assertProjectAccess(project_id, org_id, user);
    }

    const queryBuilder = this.sprintsRepository
      .createQueryBuilder('sprint')
      .leftJoin(Project, 'project', 'sprint.project_id = project.id')
      .where('project.org_id = :org_id', { org_id })
      .andWhere('sprint.project_id IN (:...allowedIds)', { allowedIds });

    if (project_id) {
      queryBuilder.andWhere('sprint.project_id = :project_id', { project_id });
    }

    const sprints = await queryBuilder.select('sprint.*').getRawMany();
    return { success: true, data: sprints };
  }

  async findOne(id: string, org_id: string, user?: ProjectViewer) {
    const sprint = await this.sprintsRepository
      .createQueryBuilder('sprint')
      .leftJoin(Project, 'project', 'sprint.project_id = project.id')
      .where('sprint.id = :id', { id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('sprint.*')
      .getRawOne();

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    await this.assertProjectAccess(sprint.project_id, org_id, user);
    return { success: true, data: sprint };
  }

  async update(id: string, org_id: string, updateSprintDto: any, user?: ProjectViewer) {
    const sprint = await this.findOne(id, org_id, user);
    if (updateSprintDto?.project_id && updateSprintDto.project_id !== sprint.data.project_id) {
      await this.assertProjectAccess(updateSprintDto.project_id, org_id, user);
    }
    await this.sprintsRepository.update(id, updateSprintDto);
    const updated = await this.sprintsRepository.findOne({ where: { id } });
    return { success: true, data: updated };
  }

  async remove(id: string, org_id: string, user?: ProjectViewer) {
    await this.findOne(id, org_id, user);
    await this.sprintsRepository.delete(id);
    return { success: true, message: 'Sprint deleted successfully' };
  }

  async getStats(id: string, org_id: string, user?: ProjectViewer) {
    await this.findOne(id, org_id, user);
    const tasks = await this.tasksRepository.find({ where: { sprint_id: id } });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'done').length;

    return {
      success: true,
      data: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    };
  }

  async findActiveSprint(project_id: string, org_id: string, user?: ProjectViewer) {
    await this.assertProjectAccess(project_id, org_id, user);

    const sprint = await this.sprintsRepository
      .createQueryBuilder('sprint')
      .leftJoin(Project, 'project', 'sprint.project_id = project.id')
      .where('sprint.project_id = :project_id', { project_id })
      .andWhere('project.org_id = :org_id', { org_id })
      .andWhere('sprint.status = :status', { status: 'active' })
      .select('sprint.*')
      .orderBy('sprint.created_at', 'DESC')
      .getRawOne();

    return { success: true, data: sprint || null };
  }

  async startSprint(id: string, org_id: string, user?: ProjectViewer) {
    const sprint = await this.sprintsRepository.findOne({ where: { id } });
    await this.findOne(id, org_id, user);
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    sprint.status = 'active';
    await this.sprintsRepository.save(sprint);
    return { success: true, data: sprint };
  }

  async completeSprint(id: string, org_id: string, user?: ProjectViewer) {
    const sprint = await this.sprintsRepository.findOne({ where: { id } });
    await this.findOne(id, org_id, user);
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Trello flow: unfinished cards return to the product Backlog; Done stays for history.
    const sprintTasks = await this.tasksRepository.find({ where: { sprint_id: id } });
    const incomplete = sprintTasks.filter(
      (t) => !['done', 'completed', 'closed', 'resolved'].includes(String(t.status || '').toLowerCase()),
    );
    for (const task of incomplete) {
      await this.tasksRepository.update(task.id, {
        sprint_id: null as any,
        status: 'backlog',
      });
    }

    sprint.status = 'completed';
    await this.sprintsRepository.save(sprint);
    return {
      success: true,
      data: sprint,
      returned_to_backlog: incomplete.length,
      completed_tasks: sprintTasks.length - incomplete.length,
    };
  }

  async addTaskToSprint(sprint_id: string, task_id: string, org_id: string, user?: ProjectViewer) {
    await this.findOne(sprint_id, org_id, user);
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('task.id = :task_id', { task_id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('task.*')
      .getRawOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.assertProjectAccess(task.project_id, org_id, user);

    await this.tasksRepository.update(task_id, { sprint_id });
    return { success: true, message: 'Task added to sprint' };
  }

  async removeTaskFromSprint(
    sprint_id: string,
    task_id: string,
    org_id: string,
    user?: ProjectViewer,
  ) {
    await this.findOne(sprint_id, org_id, user);
    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoin(Project, 'project', 'task.project_id = project.id')
      .where('task.id = :task_id', { task_id })
      .andWhere('project.org_id = :org_id', { org_id })
      .select('task.*')
      .getRawOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.assertProjectAccess(task.project_id, org_id, user);

    await this.tasksRepository.update(task_id, { sprint_id: null as any });
    return { success: true, message: 'Task removed from sprint' };
  }
}
