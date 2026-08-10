import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Goal } from '../../entities/goal.entity';
import { User } from '../../entities/user.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

  async create(org_id: string, createDto: CreateGoalDto, actor?: any) {
    const goal = this.goalRepository.create({
      id: randomUUID(),
      org_id,
      ...createDto,
      status: 'active',
      progress: 0,
    });

    await this.goalRepository.save(goal);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'goals',
      resource_id: goal.id,
      summary: `created goal "${goal.title || 'Untitled'}"`,
    });
    return { success: true, data: goal };
  }

  private async withOwnerNames(goals: Goal[]) {
    const ownerIds = [...new Set(goals.map((g) => g.owner_id).filter(Boolean))];
    const owners = ownerIds.length
      ? await this.usersRepository.find({ where: { id: In(ownerIds) } })
      : [];
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    return goals.map((goal) => {
      const owner = ownerMap.get(goal.owner_id);
      const owner_name = owner
        ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email
        : '—';
      return { ...goal, owner_name };
    });
  }

  async findAll(org_id: string, filters?: any) {
    const query = this.goalRepository.createQueryBuilder('goal')
      .where('goal.org_id = :org_id', { org_id });

    if (filters?.type) {
      query.andWhere('goal.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('goal.status = :status', { status: filters.status });
    }

    if (filters?.owner_id) {
      query.andWhere('goal.owner_id = :owner_id', { owner_id: filters.owner_id });
    }

    if (filters?.quarter) {
      query.andWhere('goal.quarter = :quarter', { quarter: filters.quarter });
    }

    if (filters?.parent_goal_id) {
      query.andWhere('goal.parent_goal_id = :parent_goal_id', { parent_goal_id: filters.parent_goal_id });
    }

    query.orderBy('goal.created_at', 'DESC');

    const goals = await query.getMany();
    return { success: true, data: await this.withOwnerNames(goals) };
  }

  async findOne(id: string, org_id: string) {
    const goal = await this.goalRepository.findOne({
      where: { id, org_id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Get child goals
    const childGoals = await this.goalRepository.find({
      where: { parent_goal_id: id, org_id },
    });

    return { 
      success: true, 
      data: {
        ...goal,
        child_goals: childGoals,
      }
    };
  }

  async update(id: string, org_id: string, updateDto: UpdateGoalDto, actor?: any) {
    const goal = await this.goalRepository.findOne({
      where: { id, org_id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Calculate progress from key results if provided
    if (updateDto.key_results) {
      const totalProgress = updateDto.key_results.reduce((sum, kr) => {
        const krProgress = (kr.current / kr.target) * 100;
        return sum + krProgress;
      }, 0);
      updateDto.progress = Math.min(100, totalProgress / updateDto.key_results.length);
    }

    Object.assign(goal, updateDto);
    await this.goalRepository.save(goal);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'goals',
      resource_id: goal.id,
      summary: `updated goal "${goal.title || 'Untitled'}"`,
      changes: updateDto as any,
    });

    return { success: true, data: goal };
  }

  async remove(id: string, org_id: string, actor?: any) {
    const goal = await this.goalRepository.findOne({
      where: { id, org_id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const title = goal.title;
    await this.goalRepository.remove(goal);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'deleted',
      resource_type: 'goals',
      resource_id: id,
      summary: `deleted goal "${title || 'Untitled'}"`,
    });
    return { success: true, message: 'Goal deleted successfully' };
  }

  async updateKeyResult(id: string, org_id: string, keyResultIndex: number, current: number) {
    const goal = await this.goalRepository.findOne({
      where: { id, org_id },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (!goal.key_results || !goal.key_results[keyResultIndex]) {
      throw new NotFoundException('Key result not found');
    }

    goal.key_results[keyResultIndex].current = current;

    // Recalculate overall progress
    const totalProgress = goal.key_results.reduce((sum, kr) => {
      const krProgress = (kr.current / kr.target) * 100;
      return sum + Math.min(100, krProgress);
    }, 0);
    goal.progress = totalProgress / goal.key_results.length;

    await this.goalRepository.save(goal);
    return { success: true, data: goal };
  }

  async getAlignment(org_id: string) {
    // Get all company-level goals
    const companyGoals = await this.goalRepository.find({
      where: { org_id, type: 'company', status: 'active' },
    });

    // Build alignment tree
    const alignment = await Promise.all(
      companyGoals.map(async (companyGoal) => {
        const departmentGoals = await this.goalRepository.find({
          where: { org_id, parent_goal_id: companyGoal.id },
        });

        const departmentWithTeamGoals = await Promise.all(
          departmentGoals.map(async (deptGoal) => {
            const teamGoals = await this.goalRepository.find({
              where: { org_id, parent_goal_id: deptGoal.id },
            });
            return { ...deptGoal, team_goals: teamGoals };
          })
        );

        return {
          ...companyGoal,
          department_goals: departmentWithTeamGoals,
        };
      })
    );

    return { success: true, data: alignment };
  }

  async getProgressReport(org_id: string, quarter?: string) {
    const query = this.goalRepository.createQueryBuilder('goal')
      .where('goal.org_id = :org_id', { org_id })
      .andWhere('goal.status = :status', { status: 'active' });

    if (quarter) {
      query.andWhere('goal.quarter = :quarter', { quarter });
    }

    const goals = await query.getMany();

    const report = {
      total_goals: goals.length,
      by_type: {
        company: goals.filter(g => g.type === 'company').length,
        department: goals.filter(g => g.type === 'department').length,
        team: goals.filter(g => g.type === 'team').length,
        individual: goals.filter(g => g.type === 'individual').length,
      },
      average_progress: goals.reduce((sum, g) => sum + g.progress, 0) / goals.length || 0,
      on_track: goals.filter(g => g.progress >= 70).length,
      at_risk: goals.filter(g => g.progress < 70 && g.progress >= 40).length,
      off_track: goals.filter(g => g.progress < 40).length,
    };

    return { success: true, data: report };
  }

  async getKeyResults(goal_id: string, org_id: string) {
    const goal = await this.goalRepository.findOne({ where: { id: goal_id, org_id } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return { success: true, data: goal.key_results || [] };
  }

  async createKeyResult(org_id: string, createDto: any) {
    const goal = await this.goalRepository.findOne({ where: { id: createDto.goal_id, org_id } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const keyResult = {
      id: randomUUID(),
      title: createDto.title,
      target: Number(createDto.target || 0),
      current: Number(createDto.current || 0),
      unit: createDto.unit || '',
    };

    goal.key_results = [...(goal.key_results || []), keyResult];
    await this.goalRepository.save(goal);
    return { success: true, data: keyResult };
  }

  async updateKeyResultById(org_id: string, key_result_id: string, updateDto: any) {
    const goals = await this.goalRepository.find({ where: { org_id } });
    const goal = goals.find((entry) =>
      (entry.key_results || []).some((kr: any) => kr.id === key_result_id),
    );

    if (!goal) {
      throw new NotFoundException('Key result not found');
    }

    goal.key_results = (goal.key_results || []).map((kr: any) =>
      kr.id === key_result_id ? { ...kr, ...updateDto } : kr,
    );
    await this.goalRepository.save(goal);
    return {
      success: true,
      data: (goal.key_results || []).find((kr: any) => kr.id === key_result_id),
    };
  }

  async deleteKeyResultById(org_id: string, key_result_id: string) {
    const goals = await this.goalRepository.find({ where: { org_id } });
    const goal = goals.find((entry) =>
      (entry.key_results || []).some((kr: any) => kr.id === key_result_id),
    );

    if (!goal) {
      throw new NotFoundException('Key result not found');
    }

    goal.key_results = (goal.key_results || []).filter((kr: any) => kr.id !== key_result_id);
    await this.goalRepository.save(goal);
    return { success: true, message: 'Key result deleted successfully' };
  }
}
