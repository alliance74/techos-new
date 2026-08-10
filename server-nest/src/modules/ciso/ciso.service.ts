import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Task } from '../../entities/task.entity';
import { Project } from '../../entities/project.entity';
import { Report } from '../../entities/report.entity';

@Injectable()
export class CisoService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  async getTasks(org_id: string, status?: 'finished' | 'not_finished') {
    const tasks = await this.tasksRepository.find({
      where: { org_id },
      order: { created_at: 'DESC' },
    });

    const filtered = tasks.filter((task) => {
      if (status === 'finished') return task.status === 'done';
      if (status === 'not_finished') return task.status !== 'done';
      return true;
    });

    return {
      success: true,
      data: filtered.map((task) => ({
        ...task,
        finished: task.status === 'done',
      })),
    };
  }

  async updateTaskStatus(org_id: string, task_id: string, finished: boolean) {
    const task = await this.tasksRepository.findOne({ where: { id: task_id, org_id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    task.status = finished ? 'done' : task.status === 'done' ? 'todo' : task.status;
    await this.tasksRepository.save(task);
    return { success: true, data: { ...task, finished: task.status === 'done' } };
  }

  async getAuditProjects(org_id: string, status?: 'needed' | 'in_progress' | 'completed') {
    const projects = await this.projectsRepository.find({
      where: { org_id },
      order: { created_at: 'DESC' },
    });

    const normalized = projects.map((project) => {
      const metadata = project.metadata || {};
      const priorityNeedsAudit = project.priority === 'high' || project.priority === 'critical';
      const auditRequired = Boolean(metadata.audit_required ?? priorityNeedsAudit);
      const auditStatus = (metadata.audit_status as string) || (auditRequired ? 'needed' : 'completed');
      return {
        ...project,
        audit_required: auditRequired,
        audit_status: auditStatus,
      };
    });

    const filtered = normalized.filter((project) => {
      if (!project.audit_required && status !== 'completed') return false;
      if (status) return project.audit_status === status;
      return project.audit_required || project.audit_status === 'in_progress';
    });

    return { success: true, data: filtered };
  }

  async updateAuditStatus(
    org_id: string,
    project_id: string,
    audit_status: 'needed' | 'in_progress' | 'completed',
  ) {
    const project = await this.projectsRepository.findOne({ where: { id: project_id, org_id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const metadata = project.metadata || {};
    project.metadata = {
      ...metadata,
      audit_required: true,
      audit_status,
      audit_updated_at: new Date().toISOString(),
    };
    await this.projectsRepository.save(project);
    return { success: true, data: project };
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
