import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';

export interface SprintDashboardData {
  sprints: SprintSummary[];
  current_sprint: SprintDetail | null;
  velocity_trend: VelocityPoint[];
  burndown: BurndownPoint[];
  team_performance: TeamMemberPerformance[];
  overview: SprintOverview;
}

export interface SprintSummary {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  total_tasks: number;
  completed_tasks: number;
  total_points: number;
  completed_points: number;
  velocity: number;
  days_total: number;
  days_elapsed: number;
  days_remaining: number;
}

export interface SprintDetail extends SprintSummary {
  tasks_by_status: { status: string; count: number }[];
  tasks_by_priority: { priority: string; count: number }[];
  completion_rate: number;
  estimated_total_hours: number;
}

export interface VelocityPoint {
  sprint_name: string;
  planned_points: number;
  completed_points: number;
  velocity: number;
}

export interface BurndownPoint {
  day: number;
  date: string;
  remaining_points: number;
  ideal_remaining: number;
}

export interface TeamMemberPerformance {
  user_id: string;
  user_name: string;
  tasks_completed: number;
  tasks_assigned: number;
  story_points_completed: number;
  completion_rate: number;
}

export interface SprintOverview {
  total_sprints: number;
  active_sprints: number;
  completed_sprints: number;
  average_velocity: number;
  average_completion_rate: number;
  total_points_completed: number;
}

@Injectable()
export class SprintAnalyticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
  ) {}

  async getDashboard(org_id: string): Promise<SprintDashboardData> {
    const sprints = await this.sprintRepository.find({
      where: { org_id },
      order: { created_at: 'ASC' },
    });

    const sprintSummaries = await Promise.all(
      sprints.map((s) => this.buildSprintSummary(s, org_id)),
    );

    const activeSprint = sprints.find((s) => s.status === 'active');
    let currentSprint: SprintDetail | null = null;
    if (activeSprint) {
      currentSprint = await this.buildSprintDetail(activeSprint, org_id);
    }

    const velocityTrend = await this.buildVelocityTrend(sprints, org_id);
    const burndown = activeSprint
      ? await this.buildBurndown(activeSprint, org_id)
      : [];
    const teamPerformance = activeSprint
      ? await this.buildTeamPerformance(activeSprint, org_id)
      : [];

    const overview = this.buildOverview(sprintSummaries);

    return {
      sprints: sprintSummaries,
      current_sprint: currentSprint,
      velocity_trend: velocityTrend,
      burndown,
      team_performance: teamPerformance,
      overview,
    };
  }

  async getSprintDetail(org_id: string, sprint_id: string): Promise<SprintDetail> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprint_id, org_id },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return this.buildSprintDetail(sprint, org_id);
  }

  async getSprintBurndown(org_id: string, sprint_id: string): Promise<BurndownPoint[]> {
    const sprint = await this.sprintRepository.findOne({
      where: { id: sprint_id, org_id },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return this.buildBurndown(sprint, org_id);
  }

  async getVelocityComparison(org_id: string): Promise<VelocityPoint[]> {
    const sprints = await this.sprintRepository.find({
      where: { org_id },
      order: { created_at: 'ASC' },
    });
    return this.buildVelocityTrend(sprints, org_id);
  }

  // --- Private Helpers ---

  /**
   * Query tasks for a sprint, scoped to org_id to prevent cross-org data leaks.
   */
  private async getTasksForSprint(sprint_id: string, org_id: string): Promise<Task[]> {
    // Use query builder to enforce org_id scoping via the project relation
    return this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .where('task.sprint_id = :sprint_id', { sprint_id })
      .andWhere('project.org_id = :org_id', { org_id })
      .getMany();
  }

  private async buildSprintSummary(sprint: Sprint, org_id: string): Promise<SprintSummary> {
    const tasks = await this.getTasksForSprint(sprint.id, org_id);

    const completed = tasks.filter((t) => t.status === 'done');
    const totalPoints = tasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const completedPoints = completed.reduce((s, t) => s + (t.story_points || 0), 0);

    const now = new Date();
    const start = new Date(sprint.start_date);
    const end = new Date(sprint.end_date);
    const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const daysElapsed = Math.max(0, Math.min(daysTotal, Math.ceil((now.getTime() - start.getTime()) / 86400000)));
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);

    return {
      id: sprint.id,
      name: sprint.name,
      status: sprint.status,
      start_date: sprint.start_date,
      end_date: sprint.end_date,
      total_tasks: tasks.length,
      completed_tasks: completed.length,
      total_points: totalPoints,
      completed_points: completedPoints,
      velocity: completedPoints,
      days_total: daysTotal,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
    };
  }

  private async buildSprintDetail(sprint: Sprint, org_id: string): Promise<SprintDetail> {
    const summary = await this.buildSprintSummary(sprint, org_id);
    const tasks = await this.getTasksForSprint(sprint.id, org_id);

    const statusMap = new Map<string, number>();
    const priorityMap = new Map<string, number>();
    for (const task of tasks) {
      statusMap.set(task.status, (statusMap.get(task.status) || 0) + 1);
      priorityMap.set(task.priority, (priorityMap.get(task.priority) || 0) + 1);
    }

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    return {
      ...summary,
      tasks_by_status: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
      tasks_by_priority: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
      completion_rate: tasks.length ? (tasks.filter((t) => t.status === 'done').length / tasks.length) * 100 : 0,
      estimated_total_hours: totalEstimatedHours,
    };
  }

  private async buildVelocityTrend(sprints: Sprint[], org_id: string): Promise<VelocityPoint[]> {
    return Promise.all(
      sprints.map(async (s) => {
        const tasks = await this.getTasksForSprint(s.id, org_id);
        const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
        const completedPoints = tasks
          .filter((t) => t.status === 'done')
          .reduce((sum, t) => sum + (t.story_points || 0), 0);

        return {
          sprint_name: s.name,
          planned_points: totalPoints,
          completed_points: completedPoints,
          velocity: completedPoints,
        };
      }),
    );
  }

  /**
   * Build burndown chart data.
   * Uses a simple linear model: ideal line goes from totalPoints to 0 over sprint duration.
   * Actual line estimates remaining points per day based on completion ratio.
   */
  private async buildBurndown(sprint: Sprint, org_id: string): Promise<BurndownPoint[]> {
    const tasks = await this.getTasksForSprint(sprint.id, org_id);
    const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = tasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const start = new Date(sprint.start_date);
    const end = new Date(sprint.end_date);
    const daysTotal = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const idealPerDay = totalPoints / daysTotal;

    const now = new Date();
    const daysElapsed = Math.max(
      0,
      Math.min(daysTotal, Math.ceil((now.getTime() - start.getTime()) / 86400000)),
    );

    // Linear interpolation: at day 0 → totalPoints, at day daysElapsed → remainingPoints
    const remainingPoints = totalPoints - completedPoints;

    const points: BurndownPoint[] = [];
    for (let day = 0; day <= daysElapsed; day++) {
      const date = new Date(start.getTime() + day * 86400000);

      // Actual: linear interpolation from totalPoints to remainingPoints over elapsed days
      const actualRemaining = daysElapsed > 0
        ? totalPoints - (day / daysElapsed) * (totalPoints - remainingPoints)
        : totalPoints;

      points.push({
        day,
        date: date.toISOString().split('T')[0],
        remaining_points: Math.round(Math.max(0, actualRemaining) * 100) / 100,
        ideal_remaining: Math.round(Math.max(0, totalPoints - day * idealPerDay) * 100) / 100,
      });
    }

    return points;
  }

  private async buildTeamPerformance(sprint: Sprint, org_id: string): Promise<TeamMemberPerformance[]> {
    const tasks = await this.getTasksForSprint(sprint.id, org_id);
    const memberMap = new Map<string, { completed: number; assigned: number; points: number }>();

    for (const task of tasks) {
      const assignees = task.assignee_ids?.length
        ? task.assignee_ids
        : task.assignee_id
        ? [task.assignee_id]
        : [];

      for (const uid of assignees) {
        if (!memberMap.has(uid)) {
          memberMap.set(uid, { completed: 0, assigned: 0, points: 0 });
        }
        const m = memberMap.get(uid)!;
        m.assigned += 1;
        if (task.status === 'done') {
          m.completed += 1;
          m.points += task.story_points || 0;
        }
      }
    }

    const result: TeamMemberPerformance[] = [];

    for (const [uid, data] of memberMap) {
      result.push({
        user_id: uid,
        user_name: uid, // Enriched by frontend via user lookup
        tasks_completed: data.completed,
        tasks_assigned: data.assigned,
        story_points_completed: data.points,
        completion_rate: data.assigned ? (data.completed / data.assigned) * 100 : 0,
      });
    }

    return result.sort((a, b) => b.story_points_completed - a.story_points_completed);
  }

  private buildOverview(summaries: SprintSummary[]): SprintOverview {
    const completed = summaries.filter((s) => s.status === 'completed');
    const active = summaries.filter((s) => s.status === 'active');

    return {
      total_sprints: summaries.length,
      active_sprints: active.length,
      completed_sprints: completed.length,
      average_velocity: completed.length
        ? completed.reduce((s, sp) => s + sp.velocity, 0) / completed.length
        : 0,
      average_completion_rate: summaries.length
        ? summaries.reduce((s, sp) => s + (sp.total_tasks ? (sp.completed_tasks / sp.total_tasks) * 100 : 0), 0) / summaries.length
        : 0,
      total_points_completed: summaries.reduce((s, sp) => s + sp.completed_points, 0),
    };
  }
}
