import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Report } from '../../entities/report.entity';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Bug } from '../../entities/bug.entity';
import { Invoice } from '../../entities/invoice.entity';
import { Expense } from '../../entities/expense.entity';
import { KPI } from '../../entities/kpi.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(KPI)
    private kpiRepository: Repository<KPI>,
  ) {}

  async createReport(org_id: string, created_by: string, createDto: any) {
    const report = this.reportRepository.create({
      id: randomUUID(),
      org_id,
      created_by,
      ...createDto,
    });

    await this.reportRepository.save(report);
    return { success: true, data: report };
  }

  async findAll(org_id: string, filters?: any) {
    const query = this.reportRepository.createQueryBuilder('report')
      .where('report.org_id = :org_id', { org_id });

    if (filters?.type) {
      query.andWhere('report.type = :type', { type: filters.type });
    }

    query.orderBy('report.created_at', 'DESC');

    const reports = await query.getMany();
    return { success: true, data: reports };
  }

  async findOne(id: string, org_id: string) {
    const report = await this.reportRepository.findOne({ where: { id, org_id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return { success: true, data: report };
  }

  async updateReport(id: string, org_id: string, updateDto: any) {
    const report = await this.reportRepository.findOne({ where: { id, org_id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    Object.assign(report, updateDto);
    await this.reportRepository.save(report);
    return { success: true, data: report };
  }

  async removeReport(id: string, org_id: string) {
    const report = await this.reportRepository.findOne({ where: { id, org_id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.reportRepository.remove(report);
    return { success: true, message: 'Report deleted successfully' };
  }

  // Generate specific report types
  async generateProjectReport(org_id: string, project_id?: string) {
    const query = this.projectRepository.createQueryBuilder('project')
      .where('project.org_id = :org_id', { org_id });

    if (project_id) {
      query.andWhere('project.id = :project_id', { project_id });
    }

    const projects = await query.getMany();

    const report = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskRepository.find({
          where: { project_id: project.id, org_id },
        });

        const bugs = await this.bugRepository.find({
          where: { project_id: project.id, org_id },
        });

        return {
          project,
          tasks: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            pending: tasks.filter(t => t.status === 'todo').length,
          },
          bugs: {
            total: bugs.length,
            open: bugs.filter(b => b.status === 'open').length,
            resolved: bugs.filter(b => b.status === 'resolved').length,
          },
        };
      })
    );

    return { success: true, data: report };
  }

  async generateFinancialReport(org_id: string, start_date?: string, end_date?: string) {
    const invoiceQuery = this.invoiceRepository.createQueryBuilder('invoice')
      .where('invoice.org_id = :org_id', { org_id });

    const expenseQuery = this.expenseRepository.createQueryBuilder('expense')
      .where('expense.org_id = :org_id', { org_id });

    if (start_date) {
      invoiceQuery.andWhere('invoice.created_at >= :start_date', { start_date });
      expenseQuery.andWhere('expense.date >= :start_date', { start_date });
    }

    if (end_date) {
      invoiceQuery.andWhere('invoice.created_at <= :end_date', { end_date });
      expenseQuery.andWhere('expense.date <= :end_date', { end_date });
    }

    const [invoices, expenses] = await Promise.all([
      invoiceQuery.getMany(),
      expenseQuery.getMany(),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expenseByCategory = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        period: { start_date, end_date },
        revenue: {
          total: totalRevenue,
          by_status: {
            paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
            pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
            overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
          },
        },
        expenses: {
          total: totalExpenses,
          by_category: expenseByCategory,
          by_status: {
            approved: expenses.filter(exp => exp.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0),
            pending: expenses.filter(exp => exp.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0),
            rejected: expenses.filter(exp => exp.status === 'rejected').reduce((sum, exp) => sum + exp.amount, 0),
          },
        },
        net_profit: totalRevenue - totalExpenses,
      },
    };
  }

  async generateKPIReport(org_id: string) {
    const kpis = await this.kpiRepository.find({ where: { org_id } });

    const report = {
      total_kpis: kpis.length,
      by_category: kpis.reduce((acc, kpi) => {
        if (!acc[kpi.category]) {
          acc[kpi.category] = [];
        }
        acc[kpi.category].push({
          name: kpi.name,
          target: kpi.target,
          current: kpi.current,
          achievement: (kpi.current / kpi.target) * 100,
        });
        return acc;
      }, {}),
      overall_achievement: kpis.reduce((sum, kpi) => sum + ((kpi.current / kpi.target) * 100), 0) / kpis.length || 0,
    };

    return { success: true, data: report };
  }

  async generateTaskReport(org_id: string, user_id?: string, start_date?: string, end_date?: string) {
    const query = this.taskRepository.createQueryBuilder('task')
      .where('task.org_id = :org_id', { org_id });

    if (user_id) {
      query.andWhere('task.assignee_id = :user_id', { user_id });
    }

    if (start_date) {
      query.andWhere('task.created_at >= :start_date', { start_date });
    }

    if (end_date) {
      query.andWhere('task.created_at <= :end_date', { end_date });
    }

    const tasks = await query.getMany();

    const report = {
      total_tasks: tasks.length,
      by_status: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      },
      by_priority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
      },
      time_tracking: {
        total_estimated: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
        total_logged: tasks.reduce((sum, t) => sum + (t.time_logged || 0), 0),
      },
      completion_rate: tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0,
    };

    return { success: true, data: report };
  }

  async generateBugReport(org_id: string, start_date?: string, end_date?: string) {
    const query = this.bugRepository.createQueryBuilder('bug')
      .where('bug.org_id = :org_id', { org_id });

    if (start_date) {
      query.andWhere('bug.created_at >= :start_date', { start_date });
    }

    if (end_date) {
      query.andWhere('bug.created_at <= :end_date', { end_date });
    }

    const bugs = await query.getMany();

    const report = {
      total_bugs: bugs.length,
      by_status: {
        open: bugs.filter(b => b.status === 'open').length,
        in_progress: bugs.filter(b => b.status === 'in_progress').length,
        resolved: bugs.filter(b => b.status === 'resolved').length,
        closed: bugs.filter(b => b.status === 'closed').length,
      },
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
      resolution_rate: bugs.length ? 
        ((bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length) / bugs.length) * 100 : 0,
    };

    return { success: true, data: report };
  }
}
