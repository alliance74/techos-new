import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CisoService } from './ciso.service';
import { ProjectAudit } from '../../entities/project-audit.entity';
import { AuditTask } from '../../entities/audit-task.entity';
import { Report } from '../../entities/report.entity';

const ORG = '11111111-1111-1111-1111-111111111111';
const USER = '22222222-2222-2222-2222-222222222222';

describe('CisoService project audits and audit tasks', () => {
  let moduleRef: TestingModule;
  let service: CisoService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ProjectAudit, AuditTask, Report],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([ProjectAudit, AuditTask, Report]),
      ],
      providers: [CisoService],
    }).compile();

    service = moduleRef.get(CisoService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates, reads, updates, and deletes a project audit', async () => {
    const created = await service.createAudit(ORG, USER, {
      name: 'Q3 Access Review',
      description: 'Privileged account audit',
    });
    expect(created.success).toBe(true);
    expect(created.data.name).toBe('Q3 Access Review');
    expect(created.data.description).toBe('Privileged account audit');
    expect(created.data.status).toBe('needed');

    const listed = await service.getAudits(ORG);
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0].task_count).toBe(0);

    const one = await service.getAudit(ORG, created.data.id);
    expect(one.data.name).toBe('Q3 Access Review');

    const updated = await service.updateAudit(ORG, created.data.id, {
      name: 'Q3 Access Review (updated)',
      status: 'in_progress',
    });
    expect(updated.data.name).toBe('Q3 Access Review (updated)');
    expect(updated.data.status).toBe('in_progress');

    const removed = await service.deleteAudit(ORG, created.data.id);
    expect(removed.data.id).toBe(created.data.id);
    await expect(service.getAudit(ORG, created.data.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates audit tasks against a selected project audit', async () => {
    const audit = await service.createAudit(ORG, USER, {
      name: 'Network Segmentation',
      description: 'Firewall and VLAN checks',
    });

    const task = await service.createAuditTask(ORG, USER, {
      project_audit_id: audit.data.id,
      title: 'Review firewall rules',
      description: 'Confirm unused rules are removed',
      priority: 'high',
    });
    expect(task.success).toBe(true);
    expect(task.data.project_audit_id).toBe(audit.data.id);
    expect(task.data.project_audit_name).toBe('Network Segmentation');
    expect(task.data.finished).toBe(false);

    const listed = await service.getAuditTasks(ORG);
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0].title).toBe('Review firewall rules');

    const finished = await service.updateAuditTaskStatus(ORG, task.data.id, true);
    expect(finished.data.finished).toBe(true);
    expect(finished.data.status).toBe('done');

    const otherAudit = await service.createAudit(ORG, USER, { name: 'Vendor Review' });
    const moved = await service.updateAuditTask(ORG, task.data.id, {
      project_audit_id: otherAudit.data.id,
      title: 'Review vendor access',
    });
    expect(moved.data.project_audit_id).toBe(otherAudit.data.id);
    expect(moved.data.project_audit_name).toBe('Vendor Review');

    await service.deleteAuditTask(ORG, task.data.id);
    const remaining = await service.getAuditTasks(ORG);
    expect(remaining.data).toHaveLength(0);

    await expect(
      service.createAuditTask(ORG, USER, {
        project_audit_id: '33333333-3333-3333-3333-333333333333',
        title: 'Orphan task',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes related audit tasks when a project audit is deleted', async () => {
    const audit = await service.createAudit(ORG, USER, { name: 'Cascade Audit' });
    await service.createAuditTask(ORG, USER, {
      project_audit_id: audit.data.id,
      title: 'Child task',
    });

    await service.deleteAudit(ORG, audit.data.id);
    const remaining = await service.getAuditTasks(ORG, { project_audit_id: audit.data.id });
    expect(remaining.data).toHaveLength(0);
  });
});
