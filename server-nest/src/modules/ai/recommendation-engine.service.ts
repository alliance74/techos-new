import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';

export interface Recommendation {
  type: 'task_priority' | 'sprint_planning' | 'team_assignment' | 'bug_escalation' | 'project_health' | 'velocity_forecast';
  title: string;
  description: string;
  confidence: number; // 0-1
  entity_id?: string;
  entity_type?: string;
  action?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async generateRecommendations(org_id: string, user_role?: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Parallel data fetching
    const [projects, tasks, sprints, bugs, users] = await Promise.all([
      this.projectRepository.find({ where: { org_id } }),
      this.taskRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
      this.sprintRepository.find({ where: { org_id }, order: { created_at: 'DESC' }, take: 5 }),
      this.bugRepository.find({ where: { org_id } }),
      this.userRepository.find({ where: { org_id } }),
    ]);

    // 1. Task priority recommendations
    const overdueTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'done';
    });
    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'task_priority',
        title: `${overdueTasks.length} overdue task(s) need attention`,
        description: `Tasks ${overdueTasks.map((t) => `"${t.title}"`).join(', ')} are past their due date.`,
        confidence: 0.95,
        priority: 'high',
        action: 'Review and reprioritize overdue tasks',
      });
    }

    // 2. Sprint health recommendations
    const activeSprint = sprints.find((s) => s.status === 'active');
    if (activeSprint) {
      const sprintTasks = tasks.filter((t) => t.sprint_id === activeSprint.id);
      const completedInSprint = sprintTasks.filter((t) => t.status === 'done');
      const completionRate = sprintTasks.length ? (completedInSprint.length / sprintTasks.length) * 100 : 0;

      const sprintEnd = new Date(activeSprint.end_date);
      const now = new Date();
      const totalDays = (sprintEnd.getTime() - new Date(activeSprint.start_date).getTime()) / 86400000;
      const daysRemaining = Math.max(0, (sprintEnd.getTime() - now.getTime()) / 86400000);
      const timeProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

      if (completionRate < timeProgress - 20) {
        recommendations.push({
          type: 'sprint_planning',
          title: `Sprint "${activeSprint.name}" is behind schedule`,
          description: `Sprint is ${timeProgress.toFixed(0)}% through time but only ${completionRate.toFixed(0)}% of tasks completed. Consider moving lower-priority items to next sprint.`,
          confidence: 0.85,
          entity_id: activeSprint.id,
          entity_type: 'sprint',
          priority: 'high',
          action: 'Review sprint backlog and adjust scope',
        });
      }

      if (completionRate > 90 && daysRemaining > 2) {
        recommendations.push({
          type: 'sprint_planning',
          title: `Sprint "${activeSprint.name}" on track for early completion`,
          description: `${completionRate.toFixed(0)}% complete with ${daysRemaining.toFixed(0)} days remaining. Team can take on additional scope.`,
          confidence: 0.8,
          entity_id: activeSprint.id,
          entity_type: 'sprint',
          priority: 'medium',
          action: 'Consider pulling in next sprint items',
        });
      }
    }

    // 3. Team assignment recommendations
    const unassignedTasks = tasks.filter((t) => !t.assignee_id && t.status === 'todo');
    if (unassignedTasks.length > 3) {
      recommendations.push({
        type: 'team_assignment',
        title: `${unassignedTasks.length} unassigned tasks in backlog`,
        description: 'Multiple tasks lack assignees. Consider assigning them to balance team workload.',
        confidence: 0.9,
        priority: 'medium',
        action: 'Review and assign unassigned tasks',
      });
    }

    // 4. Bug escalation recommendations
    const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'resolved' && b.status !== 'closed');
    if (criticalBugs.length > 0) {
      recommendations.push({
        type: 'bug_escalation',
        title: `${criticalBugs.length} critical bug(s) require immediate attention`,
        description: 'Critical bugs can impact system stability and user experience.',
        confidence: 0.95,
        priority: 'critical',
        action: 'Escalate critical bugs to team leads',
      });
    }

    // 5. Project health recommendations
    for (const project of projects) {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      if (projectTasks.length === 0) continue;

      const projectDone = projectTasks.filter((t) => t.status === 'done').length;
      const projectRate = (projectDone / projectTasks.length) * 100;

      if (projectRate < 20 && projectTasks.length > 5 && project.status === 'active') {
        recommendations.push({
          type: 'project_health',
          title: `Project "${project.name}" has low completion rate`,
          description: `Only ${projectRate.toFixed(0)}% of ${projectTasks.length} tasks completed. Review blockers and dependencies.`,
          confidence: 0.75,
          entity_id: project.id,
          entity_type: 'project',
          priority: 'medium',
          action: 'Review project blockers and reallocate resources',
        });
      }
    }

    // 6. Velocity forecast
    if (sprints.length >= 2) {
      const completedSprints = sprints.filter((s) => s.status === 'completed');
      if (completedSprints.length >= 2) {
        const velocities = await Promise.all(
          completedSprints.slice(0, 3).map(async (s) => {
            const st = await this.taskRepository.find({ where: { sprint_id: s.id } });
            return st.filter((t) => t.status === 'done').reduce((sum, t) => sum + (t.story_points || 1), 0);
          }),
        );
        const avgVelocity = velocities.length
          ? velocities.reduce((a, b) => a + b, 0) / velocities.length
          : 0;

        recommendations.push({
          type: 'velocity_forecast',
          title: `Average sprint velocity: ${avgVelocity.toFixed(1)} points`,
          description: `Based on the last ${completedSprints.length} completed sprints, the team averages ${avgVelocity.toFixed(1)} story points per sprint.`,
          confidence: 0.7,
          priority: 'low',
          action: 'Use this velocity for sprint planning',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
}
