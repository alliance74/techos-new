import { Injectable, NotFoundException, ForbiddenException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserRole } from '../../entities/user.entity';
import { Employee } from '../../entities/employee.entity';
import { CreateUserByCeoDto } from './dto/create-user-by-ceo.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    private workspaceService: WorkspaceService,
  ) {}

  async findAll(org_id: string) {
    const users = await this.usersRepository.find({ where: { org_id } });
    return { success: true, data: users.map((user) => this.safeUser(user)) };
  }

  async findOne(id: string, org_id: string) {
    const user = await this.usersRepository.findOne({ where: { id, org_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { success: true, data: this.safeUser(user) };
  }

  async update(id: string, org_id: string, actor: any, updateData: Partial<User>) {
    const user = await this.usersRepository.findOne({ where: { id, org_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSelf = actor.id === id;
    const isCeo = actor.role === UserRole.CEO;
    if (!isSelf && !isCeo) {
      throw new ForbiddenException('Only CEO can update other users');
    }
    if (!isCeo && (updateData.role || updateData.status)) {
      throw new ForbiddenException('Only CEO can update role or status');
    }

    Object.assign(user, updateData);
    await this.usersRepository.save(user);
    return { success: true, data: this.safeUser(user) };
  }

  async createByCeo(org_id: string, actor: any, dto: CreateUserByCeoDto) {
    if (actor.role !== UserRole.CEO) {
      throw new ForbiddenException('Only CEO can invite users');
    }

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (existingUser) {
      throw new ConflictException('A user with this email has already been invited');
    }

    const generatedPassword = this.generateTemporaryPassword();
    const password_hash = await bcrypt.hash(generatedPassword, 10);
    const user = this.usersRepository.create({
      id: randomUUID(),
      org_id,
      email,
      first_name: dto.firstName,
      last_name: dto.lastName,
      role: dto.role,
      status: 'active',
      password_hash,
    });

    try {
      await this.usersRepository.save(user);
    } catch (error: any) {
      // Race-safe fallback when unique email constraint fires
      if (error?.code === '23505' || String(error?.message || '').toLowerCase().includes('unique')) {
        throw new ConflictException('A user with this email has already been invited');
      }
      throw error;
    }

    const roleLabel = dto.role.replace(/_/g, ' ');
    const employee = this.employeesRepository.create({
      id: randomUUID(),
      org_id,
      user_id: user.id,
      department: roleLabel,
      position: (dto.position || '').trim() || roleLabel,
      employment_type: dto.employment_type || 'full-time',
      start_date: new Date().toISOString().slice(0, 10),
      status: dto.status || 'active',
      salary: dto.salary != null ? Number(dto.salary) : undefined,
    });
    await this.employeesRepository.save(employee);

    const displayName = `${dto.firstName} ${dto.lastName}`.trim();
    await this.workspaceService.recordActivity(
      org_id,
      'employees',
      employee.id,
      'created',
      `invited employee "${displayName}"`,
      actor,
    );

    return {
      success: true,
      data: {
        user: this.safeUser(user),
        employee,
        temporary_password: generatedPassword,
      },
    };
  }

  async updateMyProfile(org_id: string, user_id: string, dto: UpdateMyProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: user_id, org_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    await this.usersRepository.save(user);
    return { success: true, data: this.safeUser(user) };
  }

  async updateMyPassword(org_id: string, user_id: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepository.findOne({ where: { id: user_id, org_id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
    return { success: true, message: 'Password updated successfully' };
  }

  private safeUser(user: User) {
    const { password_hash, two_factor_secret, ...safe } = user as any;
    return safe;
  }

  private generateTemporaryPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let value = '';
    for (let i = 0; i < 20; i++) {
      value += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return value;
  }
}
