import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { User, UserRole } from '../../entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private leaveRequestsRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private workspaceService: WorkspaceService,
    private activityLogService: ActivityLogService,
  ) {}

  // Employees
  async createEmployee(org_id: string, createEmployeeDto: CreateEmployeeDto) {
    const user = await this.usersRepository.findOne({
      where: { id: createEmployeeDto.user_id, org_id },
    });
    const roleLabel = (user?.role || 'team member').toString().replace(/_/g, ' ');

    const employee = this.employeesRepository.create({
      id: randomUUID(),
      org_id,
      ...createEmployeeDto,
      department: createEmployeeDto.department || roleLabel,
      position: createEmployeeDto.position || roleLabel,
      employment_type: createEmployeeDto.employment_type || 'full-time',
      status: 'active',
    });

    await this.employeesRepository.save(employee);

    return {
      success: true,
      data: employee,
    };
  }

  async findAllEmployees(org_id: string, filters?: any) {
    const where: any = { org_id };
    if (filters?.status) where.status = filters.status;

    const employees = await this.employeesRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    const userIds = [...new Set(employees.map((e) => e.user_id).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [String(u.id), u]));

    const data = employees.map((row) => {
      const user = userMap.get(String(row.user_id));
      return this.mapEmployeeRow(row, user);
    });

    return {
      success: true,
      data,
    };
  }

  private mapEmployeeRow(row: Employee, user?: User | null, manager?: User | null) {
    return {
      id: row.id,
      org_id: row.org_id,
      user_id: row.user_id,
      employee_number: `E-${String(row.id).slice(0, 4).toUpperCase()}`,
      position: row.position,
      employment_type: row.employment_type,
      hire_date: row.start_date,
      start_date: row.start_date,
      salary: row.salary,
      status: row.status,
      manager_id: row.manager_id,
      emergency_contact: row.emergency_contact,
      skills: row.skills,
      created_at: row.created_at,
      user: user
        ? {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
          }
        : null,
      manager: manager
        ? {
            id: manager.id,
            first_name: manager.first_name,
            last_name: manager.last_name,
            email: manager.email,
          }
        : null,
    };
  }

  async findOneEmployee(id: string, org_id: string) {
    const employee = await this.employeesRepository.findOne({
      where: { id, org_id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [user, manager, leaveRequests] = await Promise.all([
      this.usersRepository.findOne({ where: { id: employee.user_id } }),
      employee.manager_id
        ? this.usersRepository.findOne({ where: { id: employee.manager_id } })
        : Promise.resolve(null),
      this.leaveRequestsRepository.find({
        where: { employee_id: id },
        order: { created_at: 'DESC' },
      }),
    ]);

    return {
      success: true,
      data: {
        ...this.mapEmployeeRow(employee, user, manager),
        leave_requests: leaveRequests,
      },
    };
  }

  async getEmployeeActivity(id: string, org_id: string) {
    const employee = await this.employeesRepository.findOne({
      where: { id, org_id },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    const data = await this.activityLogService.listForActor(org_id, employee.user_id);
    return { success: true, data };
  }

  async updateEmployee(id: string, org_id: string, updateData: Partial<Employee>, actor?: any) {
    const employee = await this.employeesRepository.findOne({
      where: { id, org_id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const allowed: (keyof Employee)[] = [
      'position',
      'employment_type',
      'start_date',
      'salary',
      'status',
      'manager_id',
      'emergency_contact',
      'skills',
      'department',
    ];
    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        (employee as any)[key] = updateData[key];
      }
    }

    await this.employeesRepository.save(employee);

    const [user, manager] = await Promise.all([
      this.usersRepository.findOne({ where: { id: employee.user_id } }),
      employee.manager_id
        ? this.usersRepository.findOne({ where: { id: employee.manager_id } })
        : Promise.resolve(null),
    ]);

    const displayName =
      `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
      user?.email ||
      employee.position ||
      'employee';
    await this.workspaceService.recordActivity(
      org_id,
      'employees',
      employee.id,
      'updated',
      `updated employee "${displayName}"`,
      actor,
    );

    return {
      success: true,
      data: this.mapEmployeeRow(employee, user, manager),
    };
  }

  async deleteEmployee(id: string, org_id: string, actor?: any) {
    const employee = await this.employeesRepository.findOne({
      where: { id, org_id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: employee.user_id } });
    const displayName =
      `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
      user?.email ||
      employee.position ||
      'employee';

    await this.employeesRepository.remove(employee);
    await this.workspaceService.recordActivity(
      org_id,
      'employees',
      id,
      'deleted',
      `removed employee "${displayName}"`,
      actor,
    );

    return {
      success: true,
      message: 'Employee deleted successfully',
    };
  }

  // Leave Requests
  async createLeaveRequest(org_id: string, actor: any, createLeaveRequestDto: CreateLeaveRequestDto) {
    // Get employee record
    const employee = await this.employeesRepository.findOne({
      where: { user_id: actor?.id, org_id },
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found');
    }

    const leaveRequest = this.leaveRequestsRepository.create({
      id: randomUUID(),
      employee_id: employee.id,
      org_id,
      ...createLeaveRequestDto,
      status: 'pending',
    });

    await this.leaveRequestsRepository.save(leaveRequest);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'leaves',
      resource_id: leaveRequest.id,
      summary: `requested ${createLeaveRequestDto.type || 'leave'} leave`,
    });

    // Notify manager and HR
    await this.notifyLeaveRequestCreated(org_id, employee, leaveRequest);

    return {
      success: true,
      data: leaveRequest,
    };
  }

  async findAllLeaveRequests(org_id: string, filters?: any) {
    const where: any = { org_id };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.employee_id) {
      where.employee_id = filters.employee_id;
    }

    const leaveRequests = await this.leaveRequestsRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    const employeeIds = [...new Set(leaveRequests.map((l) => String(l.employee_id)).filter(Boolean))];
    const employees = employeeIds.length
      ? await this.employeesRepository.find({ where: { id: In(employeeIds) } })
      : [];
    const employeeMap = new Map(employees.map((e) => [String(e.id), e]));

    const userIds = [...new Set(employees.map((e) => String(e.user_id)).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [String(u.id), u]));

    const data = leaveRequests.map((leave) => {
      const employee = employeeMap.get(String(leave.employee_id));
      const user = employee ? userMap.get(String(employee.user_id)) : null;
      return {
        ...leave,
        employee_first_name: user?.first_name || null,
        employee_last_name: user?.last_name || null,
        role: user?.role || null,
        employee: employee
          ? {
              id: employee.id,
              user_id: employee.user_id,
              position: employee.position,
              user: user
                ? {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                  }
                : null,
            }
          : null,
      };
    });

    return {
      success: true,
      data,
    };
  }

  async findOneLeaveRequest(id: string, org_id: string) {
    const leaveRequest = await this.leaveRequestsRepository.findOne({
      where: { id, org_id },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return {
      success: true,
      data: leaveRequest,
    };
  }

  async approveLeaveRequest(id: string, org_id: string, user_id: string, user_role: string) {
    // Check if user has permission (CEO handles HR operations)
    if (![UserRole.CEO].includes(user_role as UserRole)) {
      throw new ForbiddenException('You do not have permission to approve leave requests');
    }

    const leaveRequest = await this.leaveRequestsRepository.findOne({
      where: { id, org_id },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    leaveRequest.status = 'approved';
    leaveRequest.approved_by = user_id;
    await this.leaveRequestsRepository.save(leaveRequest);

    // Get employee info
    const employee = await this.employeesRepository.findOne({
      where: { id: leaveRequest.employee_id },
    });

    if (employee) {
      await this.notificationsService.create(org_id, {
        user_id: employee.user_id,
        type: 'leave_approved',
        title: 'Leave Request Approved',
        message: `Your ${leaveRequest.type} leave from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been approved`,
        send_email: true,
      });
    }

    return {
      success: true,
      data: leaveRequest,
    };
  }

  async rejectLeaveRequest(id: string, org_id: string, user_id: string, user_role: string, rejection_reason?: string) {
    // Check permission (CEO handles HR operations)
    if (![UserRole.CEO].includes(user_role as UserRole)) {
      throw new ForbiddenException('You do not have permission to reject leave requests');
    }

    const leaveRequest = await this.leaveRequestsRepository.findOne({
      where: { id, org_id },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    leaveRequest.status = 'rejected';
    if (rejection_reason) {
      leaveRequest.rejection_reason = rejection_reason;
    }
    await this.leaveRequestsRepository.save(leaveRequest);

    // Get employee info
    const employee = await this.employeesRepository.findOne({
      where: { id: leaveRequest.employee_id },
    });

    if (employee) {
      await this.notificationsService.create(org_id, {
        user_id: employee.user_id,
        type: 'leave_rejected',
        title: 'Leave Request Rejected',
        message: `Your ${leaveRequest.type} leave request has been rejected${rejection_reason ? ': ' + rejection_reason : ''}`,
        send_email: true,
      });
    }

    return {
      success: true,
      data: leaveRequest,
    };
  }

  async deleteLeaveRequest(id: string, org_id: string, user_id: string) {
    const leaveRequest = await this.leaveRequestsRepository.findOne({
      where: { id, org_id },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    // Get employee to verify ownership
    const employee = await this.employeesRepository.findOne({
      where: { id: leaveRequest.employee_id },
    });

    // Only allow deletion if pending and user owns it
    if (leaveRequest.status !== 'pending' || (employee && employee.user_id !== user_id)) {
      throw new ForbiddenException('You can only delete your own pending leave requests');
    }

    await this.leaveRequestsRepository.remove(leaveRequest);

    return {
      success: true,
      message: 'Leave request deleted successfully',
    };
  }

  // Helper methods
  private async notifyLeaveRequestCreated(org_id: string, employee: Employee, leaveRequest: LeaveRequest) {
    // Notify manager
    if (employee.manager_id) {
      await this.notificationsService.create(org_id, {
        user_id: employee.manager_id,
        type: 'leave_request_pending',
        title: 'New Leave Request',
        message: `Leave request from employee for ${leaveRequest.type} leave`,
        send_email: true,
      });
    }

    // Notify HR team (CEO handles HR operations)
    const hrUsers = await this.usersRepository.find({
      where: { org_id, role: UserRole.CEO },
    });

    for (const hrUser of hrUsers) {
      await this.notificationsService.create(org_id, {
        user_id: hrUser.id,
        type: 'leave_request_pending',
        title: 'New Leave Request',
        message: `New ${leaveRequest.type} leave request pending approval`,
        send_email: true,
      });
    }
  }

  // Statistics
  async getHrStats(org_id: string) {
    const totalEmployees = await this.employeesRepository.count({
      where: { org_id, status: 'active' },
    });

    const pendingLeaves = await this.leaveRequestsRepository.count({
      where: { org_id, status: 'pending' },
    });

    const users = await this.usersRepository.find({ where: { org_id } });
    const roleCount = new Set(users.map((u) => u.role).filter(Boolean)).size;

    return {
      success: true,
      data: {
        total_employees: totalEmployees,
        pending_leave_requests: pendingLeaves,
        role_count: roleCount,
      },
    };
  }
}
