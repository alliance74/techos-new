import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Report } from '../../entities/report.entity';
import { ProjectAudit } from '../../entities/project-audit.entity';
import { AuditTask } from '../../entities/audit-task.entity';
import { CreateProjectAuditDto } from './dto/create-project-audit.dto';
import { UpdateProjectAuditDto } from './dto/update-project-audit.dto';
import { CreateAuditTaskDto } from './dto/create-audit-task.dto';
import { UpdateAuditTaskDto } from './dto/update-audit-task.dto';

@Injectable()
export class CisoService {
  constructor(
    @InjectRepository(ProjectAudit)
    private projectAuditsRepository: Repository<ProjectAudit>,
    @InjectRepository(AuditTask)
    private auditTasksRepository: Repository<AuditTask>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  private serializeAudit(audit: ProjectAudit, taskCount = 0) {
    return {
      ...audit,
      audit_status: audit.status,
      task_count: taskCount,
    };
  }

  private serializeTask(task: AuditTask) {
    return {
      ...task,
      finished: task.status === 'done',
      project_audit_name: task.project_audit?.name || null,
    };
  }

  private async getAuditOrThrow(org_id: string, id: string) {
    const audit = await this.projectAuditsRepository.findOne({ where: { id, org_id } });
    if (!audit) {
      throw new NotFoundException('Project audit not found');
    }
    return audit;
  }

  async createAudit(org_id: string, user_id: string, payload: CreateProjectAuditDto) {
    const audit = this.projectAuditsRepository.create({
      id: randomUUID(),
      org_id,
      created_by: user_id,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      status: payload.status || 'needed',
    });
    await this.projectAuditsRepository.save(audit);
    return { success: true, data: this.serializeAudit(audit, 0) };
  }

  async getAudits(org_id: string, status?: 'needed' | 'in_progress' | 'completed') {
    const query = this.projectAuditsRepository
      .createQueryBuilder('audit')
      .loadRelationCountAndMap('audit.task_count', 'audit.tasks')
      .where('audit.org_id = :org_id', { org_id })
      .orderBy('audit.created_at', 'DESC');

    if (status) {
      query.andWhere('audit.status = :status', { status });
    }

    const audits = await query.getMany();
    return {
      success: true,
      data: audits.map((audit) =>
        this.serializeAudit(audit, Number((audit as ProjectAudit & { task_count?: number }).task_count || 0)),
      ),
    };
  }

  async getAudit(org_id: string, id: string) {
    const audit = await this.projectAuditsRepository.findOne({
      where: { id, org_id },
      relations: ['tasks'],
    });
    if (!audit) {
      throw new NotFoundException('Project audit not found');
    }
    const tasks = (audit.tasks || [])
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .map((task) => this.serializeTask({ ...task, project_audit: audit }));
    return {
      success: true,
      data: {
        ...this.serializeAudit(audit, tasks.length),
        tasks,
      },
    };
  }

  async updateAudit(org_id: string, id: string, payload: UpdateProjectAuditDto) {
    const audit = await this.getAuditOrThrow(org_id, id);
    if (payload.name !== undefined) audit.name = payload.name.trim();
    if (payload.description !== undefined) audit.description = payload.description?.trim() || null;
    if (payload.status !== undefined) audit.status = payload.status;
    await this.projectAuditsRepository.save(audit);
    const taskCount = await this.auditTasksRepository.count({ where: { project_audit_id: id, org_id } });
    return { success: true, data: this.serializeAudit(audit, taskCount) };
  }

  async deleteAudit(org_id: string, id: string) {
    const audit = await this.getAuditOrThrow(org_id, id);
    await this.auditTasksRepository.delete({ project_audit_id: id, org_id });
    await this.projectAuditsRepository.remove(audit);
    return { success: true, data: { id } };
  }

  async createAuditTask(org_id: string, user_id: string, payload: CreateAuditTaskDto) {
    await this.getAuditOrThrow(org_id, payload.project_audit_id);
    const task = this.auditTasksRepository.create({
      id: randomUUID(),
      org_id,
      created_by: user_id,
      project_audit_id: payload.project_audit_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      status: payload.status || 'todo',
      priority: payload.priority || 'medium',
    });
    await this.auditTasksRepository.save(task);
    const saved = await this.auditTasksRepository.findOne({
      where: { id: task.id, org_id },
      relations: ['project_audit'],
    });
    if (!saved) {
      throw new NotFoundException('Audit task not found');
    }
    return { success: true, data: this.serializeTask(saved) };
  }

  async getAuditTasks(
    org_id: string,
    filters?: { status?: 'finished' | 'not_finished'; project_audit_id?: string },
  ) {
    const query = this.auditTasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project_audit', 'project_audit')
      .where('task.org_id = :org_id', { org_id })
      .orderBy('task.created_at', 'DESC');

    if (filters?.project_audit_id) {
      query.andWhere('task.project_audit_id = :project_audit_id', {
        project_audit_id: filters.project_audit_id,
      });
    }

    if (filters?.status === 'finished') {
      query.andWhere('task.status = :status', { status: 'done' });
    } else if (filters?.status === 'not_finished') {
      query.andWhere('task.status != :status', { status: 'done' });
    }

    const tasks = await query.getMany();
    return { success: true, data: tasks.map((task) => this.serializeTask(task)) };
  }

  async getAuditTask(org_id: string, id: string) {
    const task = await this.auditTasksRepository.findOne({
      where: { id, org_id },
      relations: ['project_audit'],
    });
    if (!task) {
      throw new NotFoundException('Audit task not found');
    }
    return { success: true, data: this.serializeTask(task) };
  }

  async updateAuditTask(org_id: string, id: string, payload: UpdateAuditTaskDto) {
    const task = await this.auditTasksRepository.findOne({ where: { id, org_id } });
    if (!task) {
      throw new NotFoundException('Audit task not found');
    }
    if (payload.project_audit_id && payload.project_audit_id !== task.project_audit_id) {
      await this.getAuditOrThrow(org_id, payload.project_audit_id);
      task.project_audit_id = payload.project_audit_id;
    }
    if (payload.title !== undefined) task.title = payload.title.trim();
    if (payload.description !== undefined) task.description = payload.description?.trim() || null;
    if (payload.status !== undefined) task.status = payload.status;
    if (payload.priority !== undefined) task.priority = payload.priority;
    await this.auditTasksRepository.save(task);
    const saved = await this.auditTasksRepository.findOne({
      where: { id, org_id },
      relations: ['project_audit'],
    });
    if (!saved) {
      throw new NotFoundException('Audit task not found');
    }
    return { success: true, data: this.serializeTask(saved) };
  }

  async updateAuditTaskStatus(org_id: string, id: string, finished: boolean) {
    return this.updateAuditTask(org_id, id, { status: finished ? 'done' : 'todo' });
  }

  async deleteAuditTask(org_id: string, id: string) {
    const task = await this.auditTasksRepository.findOne({ where: { id, org_id } });
    if (!task) {
      throw new NotFoundException('Audit task not found');
    }
    await this.auditTasksRepository.remove(task);
    return { success: true, data: { id } };
  }

  async getReports(org_id: string) {
    const reports = await this.reportsRepository.find({
      where: { org_id },
      order: { created_at: 'DESC' },
    });
    const filtered = reports.filter((report) =>
      ['security', 'audit', 'compliance', 'risk'].includes((report.type || '').toLowerCase()),
    );
    return { success: true, data: filtered };
  }

  async createReport(org_id: string, user_id: string, payload: { title: string; summary?: string; type?: string }) {
    const report = this.reportsRepository.create({
      id: randomUUID(),
      org_id,
      created_by: user_id,
      title: payload.title,
      type: payload.type || 'security',
      config: { source: 'ciso_portal' },
      data: {
        summary: payload.summary || 'Security report drafted from CISO portal',
      },
      scheduled: null as any,
    });

    await this.reportsRepository.save(report);
    return { success: true, data: report };
  }
}
