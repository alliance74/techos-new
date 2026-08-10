import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { Goal } from '../../entities/goal.entity';
import { Meeting } from '../../entities/meeting.entity';
import { Notification } from '../../entities/notification.entity';
import { Announcement } from '../../entities/announcement.entity';
import { Invoice } from '../../entities/invoice.entity';
import { Expense } from '../../entities/expense.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { Report } from '../../entities/report.entity';
import { User } from '../../entities/user.entity';
import { canViewProject } from '../../common/utils/project-visibility';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDeveloperDashboard(user_id: string, org_id: string, user_role?: string) {
    const [assignedTasks, myBugs, upcomingMeetings, notifications, announcements, visibleProjects] =
      await Promise.all([
        this.taskRepository.find({
          where: [
            { assignee_id: user_id, org_id },
          ],
          order: { due_date: 'ASC', created_at: 'DESC' },
          take: 50,
        }),
        this.bugRepository.find({
          where: { assignee_id: user_id, org_id },
          order: { priority: 'DESC', created_at: 'DESC' },
          take: 20,
        }),
        this.meetingRepository
          .createQueryBuilder('meeting')
          .where('meeting.org_id = :org_id', { org_id })
          .andWhere('meeting.scheduled_at >= :now', { now: new Date().toISOString() })
          .orderBy('meeting.scheduled_at', 'ASC')
          .take(5)
          .getMany(),
        this.notificationRepository.find({
          where: { user_id, is_read: false },
          order: { created_at: 'DESC' },
          take: 10,
        }),
        this.announcementRepository.find({
          where: { org_id },
          order: { is_pinned: 'DESC', created_at: 'DESC' },
          take: 3,
        }),
        this.projectRepository.find({
          where: { org_id },
          order: { created_at: 'DESC' },
          take: 40,
        }),
      ]);

    // Apply project role visibility for the signed-in role
    const role = String(user_role || 'software_engineer').toLowerCase();
    const projects = visibleProjects.filter((p) =>
      canViewProject(p, { role, id: user_id }),
    );

    const openBugs = myBugs.filter((b) => !/done|closed|resolved/i.test(String(b.status)));
    const activeTasks = assignedTasks.filter((t) => !/done|completed|closed/i.test(String(t.status)));
    const inProgress = assignedTasks.filter((t) => /in_progress|in-progress/i.test(String(t.status)));
    const todo = assignedTasks.filter((t) => /todo|backlog|open/i.test(String(t.status)));

    const activeSprint = await this.sprintRepository.findOne({
      where: { org_id, status: 'active' },
    });

    return {
      success: true,
      data: {
        my_tasks: activeTasks.slice(0, 12),
        my_bugs: openBugs.slice(0, 8),
        task_counts: {
          total: assignedTasks.length,
          active: activeTasks.length,
          in_progress: inProgress.length,
          todo: todo.length,
          done: assignedTasks.length - activeTasks.length,
        },
        bug_counts: {
          total: myBugs.length,
          open: openBugs.length,
        },
        projects: {
          total: projects.length,
          active: projects.filter((p) => /active/i.test(String(p.status))).length,
        },
        active_sprint: activeSprint,
        upcoming_meetings: upcomingMeetings,
        notifications,
        announcements,
      },
    };
  }

  async getExecutiveDashboard(org_id: string) {
    const [projectCount, activeProjectCount, goals, announcements, recentMeetings, financials, teamSize] =
      await Promise.all([
        this.projectRepository.count({ where: { org_id } }),
        this.projectRepository.count({ where: { org_id, status: 'active' } }),
        this.goalRepository.find({ where: { org_id, type: 'company', status: 'active' } }),
        this.announcementRepository.find({ where: { org_id }, order: { created_at: 'DESC' }, take: 5 }),
        this.meetingRepository.find({ where: { org_id }, order: { scheduled_at: 'DESC' }, take: 5 }),
        Promise.all([
          this.invoiceRepository.find({ where: { org_id } }),
          this.expenseRepository.find({ where: { org_id } }),
        ]),
        this.usersRepository.count({ where: { org_id } }),
      ]);

    const [invoices, expenses] = financials;
    // Revenue = paid invoices only (drafts/sent are not recognized revenue)
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount || inv.total || 0), 0);
    const totalExpenses = expenses
      .filter((exp) => exp.status === 'approved')
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const outstandingInvoices = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.amount || inv.total || 0), 0);

    const allTasks = await this.taskRepository.find({ where: { org_id } });
    const teamProductivity = {
      total_tasks: allTasks.length,
      completed: allTasks.filter((t) => t.status === 'done').length,
      in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
    };

    const recentProjects = await this.projectRepository.find({
      where: { org_id },
      order: { created_at: 'DESC' },
      take: 5,
    });

    return {
      success: true,
      data: {
        projects: {
          total: projectCount,
          active: activeProjectCount,
        },
        goals: {
          total: goals.length,
          average_progress: goals.reduce((sum, g) => sum + g.progress, 0) / goals.length || 0,
        },
        financials: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          outstanding: outstandingInvoices,
          net: totalRevenue - totalExpenses,
        },
        teamSize,
        employees: teamSize,
        team_productivity: teamProductivity,
        recent_projects: recentProjects,
        company_goals: goals,
        announcements: announcements,
        recent_meetings: recentMeetings,
      },
    };
  }

  async getProductDashboard(org_id: string) {
    const [features, bugs, upcomingReleases] = await Promise.all([
      this.taskRepository.find({ where: { org_id }, order: { created_at: 'DESC' }, take: 10 }),
      this.bugRepository.find({ where: { org_id, status: 'open' }, order: { priority: 'DESC' } }),
      this.meetingRepository.find({ where: { org_id }, order: { scheduled_at: 'ASC' }, take: 5 }),
    ]);

    return {
      success: true,
      data: {
        features: features,
        bugs: {
          total: bugs.length,
          critical: bugs.filter(b => b.severity === 'critical').length,
          high: bugs.filter(b => b.severity === 'high').length,
        },
        upcoming_releases: upcomingReleases,
      },
    };
  }

  async getFinanceDashboard(org_id: string) {
    const [invoices, expenses, budgets] = await Promise.all([
      this.invoiceRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
      this.expenseRepository.find({ where: { org_id }, order: { date: 'DESC' } }),
      this.expenseRepository.createQueryBuilder('expense')
        .select('expense.category', 'category')
        .addSelect('SUM(expense.amount)', 'total')
        .where('expense.org_id = :org_id', { org_id })
        .groupBy('expense.category')
        .getRawMany(),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

    return {
      success: true,
      data: {
        summary: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_profit: totalRevenue - totalExpenses,
        },
        invoices: {
          total: invoices.length,
          paid: invoices.filter(inv => inv.status === 'paid').length,
          pending: pendingInvoices.length,
          overdue: invoices.filter(inv => inv.status === 'overdue').length,
        },
        expenses: {
          total: totalExpenses,
          pending_approval: expenses.filter(exp => exp.status === 'pending').length,
        },
        recent_invoices: invoices.slice(0, 5),
        recent_expenses: expenses.slice(0, 5),
        expense_by_category: budgets,
      },
    };
  }

  async getHRDashboard(org_id: string) {
    const [leaveRequests, announcements] = await Promise.all([
      this.leaveRequestRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
      this.announcementRepository.find({ where: { org_id }, order: { created_at: 'DESC' }, take: 5 }),
    ]);

    return {
      success: true,
      data: {
        leave_requests: {
          total: leaveRequests.length,
          pending: leaveRequests.filter(lr => lr.status === 'pending').length,
          approved: leaveRequests.filter(lr => lr.status === 'approved').length,
          rejected: leaveRequests.filter(lr => lr.status === 'rejected').length,
        },
        recent_leave_requests: leaveRequests.slice(0, 10),
        announcements: announcements,
      },
    };
  }

  async getCisoDashboard(org_id: string) {
    const [tasks, projects, reports] = await Promise.all([
      this.taskRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
      this.projectRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
      this.reportRepository.find({ where: { org_id }, order: { created_at: 'DESC' } }),
    ]);

    const auditProjects = projects
      .map((project) => {
        const metadata = project.metadata || {};
        const auditStatus = metadata.audit_status || 'needed';
        const auditRequired = Boolean(metadata.audit_required ?? ['high', 'critical'].includes(project.priority));
        return { ...project, audit_status: auditStatus, audit_required: auditRequired };
      })
      .filter((project) => project.audit_required);

    const securityReports = reports.filter((report) =>
      ['security', 'audit', 'compliance', 'risk'].includes((report.type || '').toLowerCase()),
    );

    return {
      success: true,
      data: {
        tasks: {
          total: tasks.length,
          finished: tasks.filter((task) => task.status === 'done').length,
          not_finished: tasks.filter((task) => task.status !== 'done').length,
        },
        audits: {
          total: auditProjects.length,
          needed: auditProjects.filter((project: any) => project.audit_status === 'needed').length,
          in_progress: auditProjects.filter((project: any) => project.audit_status === 'in_progress').length,
          completed: auditProjects.filter((project: any) => project.audit_status === 'completed').length,
        },
        reports: {
          total: securityReports.length,
          recent: securityReports.slice(0, 5),
        },
      },
    };
  }
}
