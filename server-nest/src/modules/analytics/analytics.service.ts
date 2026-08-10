import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { User } from '../../entities/user.entity';
import { Bug } from '../../entities/bug.entity';
import { KPI } from '../../entities/kpi.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(KPI)
    private kpiRepository: Repository<KPI>,
  ) {}

  async getProjectAnalytics(org_id: string, project_id?: string) {
    const query = this.projectRepository.createQueryBuilder('project')
      .where('project.org_id = :org_id', { org_id });

    if (project_id) {
      query.andWhere('project.id = :project_id', { project_id });
    }

    const projects = await query.getMany();
    
    const analytics = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskRepository.find({
          where: { project_id: project.id, org_id },
        });

        const completedTasks = tasks.filter(t => t.status === 'done');
        const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
        const totalLoggedHours = tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0);

        return {
          project_id: project.id,
          project_name: project.name,
          total_tasks: tasks.length,
          completed_tasks: completedTasks.length,
          in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
          pending_tasks: tasks.filter(t => t.status === 'todo').length,
          completion_rate: tasks.length ? (completedTasks.length / tasks.length) * 100 : 0,
          estimated_hours: totalEstimatedHours,
          logged_hours: totalLoggedHours,
          efficiency: totalEstimatedHours ? (totalLoggedHours / totalEstimatedHours) * 100 : 0,
        };
      })
    );

    return { success: true, data: project_id ? analytics[0] : analytics };
  }

  async getTeamProductivity(org_id: string, start_date?: string, end_date?: string) {
    const users = await this.userRepository.find({ where: { org_id } });

    const productivity = await Promise.all(
      users.map(async (user) => {
        const tasksQuery = this.taskRepository.createQueryBuilder('task')
          .where('task.org_id = :org_id', { org_id })
          .andWhere('task.assignee_id = :user_id', { user_id: user.id });

        if (start_date) {
          tasksQuery.andWhere('task.created_at >= :start_date', { start_date });
        }
        if (end_date) {
          tasksQuery.andWhere('task.created_at <= :end_date', { end_date });
        }

        const tasks = await tasksQuery.getMany();
        const completedTasks = tasks.filter(t => t.status === 'done');

        return {
          user_id: user.id,
          user_name: user.name,
          total_tasks: tasks.length,
          completed_tasks: completedTasks.length,
          in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
          completion_rate: tasks.length ? (completedTasks.length / tasks.length) * 100 : 0,
          total_logged_hours: tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0),
        };
      })
    );

    return { success: true, data: productivity };
  }

  async getSprintAnalytics(org_id: string, sprint_id?: string) {
    const query = this.sprintRepository.createQueryBuilder('sprint')
      .where('sprint.org_id = :org_id', { org_id });

    if (sprint_id) {
      query.andWhere('sprint.id = :sprint_id', { sprint_id });
    }

    const sprints = await query.getMany();

    const analytics = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await this.taskRepository.find({
          where: { sprint_id: sprint.id, org_id },
        });

        const completedTasks = tasks.filter(t => t.status === 'done');
        const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const completedPoints = completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

        return {
          sprint_id: sprint.id,
          sprint_name: sprint.name,
          status: sprint.status,
          total_tasks: tasks.length,
          completed_tasks: completedTasks.length,
          total_story_points: totalPoints,
          completed_story_points: completedPoints,
          velocity: completedPoints,
          completion_rate: tasks.length ? (completedTasks.length / tasks.length) * 100 : 0,
        };
      })
    );

    return { success: true, data: sprint_id ? analytics[0] : analytics };
  }

  async getBugAnalytics(org_id: string) {
    const bugs = await this.bugRepository.find({ where: { org_id } });

    const analytics = {
      total_bugs: bugs.length,
      open_bugs: bugs.filter(b => b.status === 'open').length,
      in_progress_bugs: bugs.filter(b => b.status === 'in_progress').length,
      resolved_bugs: bugs.filter(b => b.status === 'resolved').length,
      closed_bugs: bugs.filter(b => b.status === 'closed').length,
      by_severity: {
        critical: bugs.filter(b => b.severity === 'critical').length,
        high: bugs.filter(b => b.severity === 'high').length,
        medium: bugs.filter(b => b.severity === 'medium').length,
        low: bugs.filter(b => b.severity === 'low').length,
      },
      by_priority: {
        high: bugs.filter(b => b.priority === 'high').length,
        medium: bugs.filter(b => b.priority === 'medium').length,
        low: bugs.filter(b => b.priority === 'low').length,
      },
    };

    return { success: true, data: analytics };
  }

  async getTimeTracking(org_id: string, user_id?: string, project_id?: string) {
    const query = this.taskRepository.createQueryBuilder('task')
      .where('task.org_id = :org_id', { org_id });

    if (user_id) {
      query.andWhere('task.assignee_id = :user_id', { user_id });
    }

    if (project_id) {
      query.andWhere('task.project_id = :project_id', { project_id });
    }

    const tasks = await query.getMany();

    const analytics = {
      total_estimated_hours: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
      total_logged_hours: tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0),
      tasks_with_time_logged: tasks.filter(t => t.time_logged > 0).length,
      average_logged_per_task: tasks.length ? 
        tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0) / tasks.length : 0,
      efficiency_rate: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) ? 
        (tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0) / 
         tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)) * 100 : 0,
    };

    return { success: true, data: analytics };
  }

  async getOverview(org_id: string) {
    const [projects, tasks, sprints, bugs, users] = await Promise.all([
      this.projectRepository.find({ where: { org_id } }),
      this.taskRepository.find({ where: { org_id } }),
      this.sprintRepository.find({ where: { org_id } }),
      this.bugRepository.find({ where: { org_id } }),
      this.userRepository.find({ where: { org_id } }),
    ]);

    const overview = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
      },
      tasks: {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      sprints: {
        total: sprints.length,
        active: sprints.filter(s => s.status === 'active').length,
        completed: sprints.filter(s => s.status === 'completed').length,
      },
      bugs: {
        total: bugs.length,
        open: bugs.filter(b => b.status === 'open').length,
        resolved: bugs.filter(b => b.status === 'resolved').length,
      },
      team: {
        total_members: users.length,
        active_members: users.filter(u => u.status === 'active').length,
      },
    };

    return { success: true, data: overview };
  }

  // KPI Management
  async createKPI(org_id: string, owner_id: string, createDto: any) {
    const kpi = this.kpiRepository.create({
      id: randomUUID(),
      org_id,
      owner_id,
      name: createDto.name,
      description: createDto.description ?? null,
      target: Number(createDto.target) || 0,
      current: Number(createDto.current) || 0,
      unit: createDto.unit || '',
      frequency: createDto.frequency || 'monthly',
      category: createDto.category || null,
    });

    await this.kpiRepository.save(kpi);
    return { success: true, data: kpi };
  }

  async getAllKPIs(org_id: string, filters?: any) {
    const query = this.kpiRepository.createQueryBuilder('kpi')
      .where('kpi.org_id = :org_id', { org_id });

    if (filters?.category) {
      query.andWhere('kpi.category = :category', { category: filters.category });
    }

    if (filters?.owner_id) {
      query.andWhere('kpi.owner_id = :owner_id', { owner_id: filters.owner_id });
    }

    const kpis = await query.getMany();
    return { success: true, data: kpis };
  }

  async updateKPI(id: string, org_id: string, updateDto: any) {
    const kpi = await this.kpiRepository.findOne({ where: { id, org_id } });
    if (!kpi) {
      throw new Error('KPI not found');
    }

    Object.assign(kpi, updateDto);
    await this.kpiRepository.save(kpi);
    return { success: true, data: kpi };
  }
}
