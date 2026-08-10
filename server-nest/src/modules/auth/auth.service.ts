import { Injectable, ConflictException, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserRole } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { Employee } from '../../entities/employee.entity';
import { Notification } from '../../entities/notification.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SEEDED_CEO_EMAIL = 'ceo@gmail.com';
const SEEDED_CEO_PASSWORD = 'Ceo@2026';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(ChannelMember)
    private channelMembersRepository: Repository<ChannelMember>,
    @InjectRepository(MeetingParticipant)
    private meetingParticipantsRepository: Repository<MeetingParticipant>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedCeoAccount();
  }

  private shouldKeepCeoOnly(): boolean {
    const flag = (process.env.SEED_CEO_ONLY || '').toLowerCase();
    // Explicit opt-in only — do not wipe invited teammates on every restart
    return flag === 'true' || flag === '1';
  }

  private async purgeNonCeoUsers(orgId: string) {
    if (!this.shouldKeepCeoOnly()) return;

    const extras = await this.usersRepository.find({ where: { org_id: orgId } });
    const toRemove = extras.filter(
      (u) => (u.email || '').toLowerCase() !== SEEDED_CEO_EMAIL,
    );
    if (!toRemove.length) return;

    const ids = toRemove.map((u) => u.id);
    await this.employeesRepository.delete({ user_id: In(ids) });
    await this.notificationsRepository.delete({ user_id: In(ids) });
    await this.channelMembersRepository.delete({ user_id: In(ids) });
    await this.meetingParticipantsRepository.delete({ user_id: In(ids) });
    await this.usersRepository.delete({ id: In(ids) });
    this.logger.warn(
      `Removed ${ids.length} non-CEO user(s) (SEED_CEO_ONLY bootstrap cleanup)`,
    );
  }

  private async seedCeoAccount() {
    let organization = await this.organizationsRepository.findOne({
      where: { slug: 'techos-company' },
    });

    if (!organization) {
      organization = this.organizationsRepository.create({
        id: randomUUID(),
        name: 'TechOS Company',
        slug: 'techos-company',
      });
      await this.organizationsRepository.save(organization);
      this.logger.log('Seeded organization: TechOS Company');
    }

    const existingCeo = await this.usersRepository.findOne({
      where: { email: SEEDED_CEO_EMAIL },
    });

    if (existingCeo) {
      // Keep credentials in sync for local bootstrap
      existingCeo.password_hash = await bcrypt.hash(SEEDED_CEO_PASSWORD, 10);
      existingCeo.role = UserRole.CEO;
      existingCeo.status = 'active';
      existingCeo.first_name = 'Alliance';
      existingCeo.last_name = '';
      existingCeo.name = 'Alliance';
      existingCeo.org_id = organization.id;
      await this.usersRepository.save(existingCeo);
      this.logger.log(`CEO account ready: ${SEEDED_CEO_EMAIL}`);
    } else {
      const password_hash = await bcrypt.hash(SEEDED_CEO_PASSWORD, 10);
      const ceo = this.usersRepository.create({
        id: randomUUID(),
        org_id: organization.id,
        email: SEEDED_CEO_EMAIL,
        password_hash,
        first_name: 'Alliance',
        last_name: '',
        name: 'Alliance',
        role: UserRole.CEO,
        status: 'active',
      });
      await this.usersRepository.save(ceo);
      this.logger.log(`Seeded CEO account: ${SEEDED_CEO_EMAIL} / ${SEEDED_CEO_PASSWORD}`);
    }

    await this.purgeNonCeoUsers(organization.id);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role, organizationName } = registerDto;

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Get or create the single organization
    let organization = await this.organizationsRepository.findOne({
      where: { slug: 'techos-company' } // Single organization for all users
    });

    if (!organization) {
      // Create organization if it doesn't exist (first user registration)
      organization = this.organizationsRepository.create({
        id: randomUUID(),
        name: organizationName || 'TechOS Company',
        slug: 'techos-company',
      });
      await this.organizationsRepository.save(organization);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with selected role
    const user = this.usersRepository.create({
      id: randomUUID(),
      org_id: organization.id,
      email,
      password_hash,
      first_name: firstName,
      last_name: lastName,
      role: role, // Use the role provided by user
      status: 'active',
    });
    await this.usersRepository.save(user);

    // Generate token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      org_id: user.org_id,
      role: user.role,
    });

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          org_id: user.org_id,
          preferences: user.preferences,
        },
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      org_id: user.org_id,
      role: user.role,
    });

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          org_id: user.org_id,
          preferences: user.preferences,
        },
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar: user.avatar,
        org_id: user.org_id,
        organization: user.organization,
        preferences: user.preferences,
      },
    };
  }
}
