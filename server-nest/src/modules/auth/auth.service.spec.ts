import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { Employee } from '../../entities/employee.entity';
import { Notification } from '../../entities/notification.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { Project } from '../../entities/project.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Task } from '../../entities/task.entity';

const ORG_ID = 'org-00000000-0000-0000-0000-000000000001';

const ALL_ENTITIES = [
  User, Organization, Employee, Notification, ChannelMember,
  MeetingParticipant, Project, Sprint, Task,
];

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;
  let usersRepo: Repository<User>;
  let orgsRepo: Repository<Organization>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature(ALL_ENTITIES),
      ],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    orgsRepo = module.get(getRepositoryToken(Organization));

    await orgsRepo.save({ id: ORG_ID, name: 'Test Org', slug: 'techos-company' });
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await service.register({
        email: 'engineer@test.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.SOFTWARE_ENGINEER,
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.user.email).toBe('engineer@test.com');
      expect(result.data.user.role).toBe(UserRole.SOFTWARE_ENGINEER);
      expect(result.data.user.org_id).toBe(ORG_ID);
    });

    it('should reject duplicate email registration', async () => {
      await expect(
        service.register({
          email: 'engineer@test.com',
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'User',
          role: UserRole.SOFTWARE_ENGINEER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should assign the role provided during registration', async () => {
      const result = await service.register({
        email: 'cto@test.com',
        password: 'Password123!',
        firstName: 'CTO',
        lastName: 'User',
        role: UserRole.CTO,
      });
      expect(result.data.user.role).toBe(UserRole.CTO);
    });

    it('should assign users to the same org via slug', async () => {
      const result = await service.register({
        email: 'finance@test.com',
        password: 'Password123!',
        firstName: 'Finance',
        lastName: 'User',
        role: UserRole.FINANCE,
      });
      expect(result.data.user.org_id).toBe(ORG_ID);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await service.login({
        email: 'engineer@test.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-jwt-token');
      expect(result.data.user.email).toBe('engineer@test.com');
    });

    it('should reject login with wrong password', async () => {
      await expect(
        service.login({ email: 'engineer@test.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        service.login({ email: 'noexist@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return profile for a valid user', async () => {
      const user = await usersRepo.findOne({ where: { email: 'engineer@test.com' } });
      const result = await service.getProfile(user!.id);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('engineer@test.com');
    });
  });

  describe('organization isolation', () => {
    it('should store org_id correctly on registration', async () => {
      const result = await service.register({
        email: 'isolated@test.com',
        password: 'Password123!',
        firstName: 'Iso',
        lastName: 'User',
        role: UserRole.CISO,
      });
      expect(result.data.user.org_id).toBe(ORG_ID);
    });

    it('should generate JWT containing org_id', async () => {
      const jwtService = module.get(JwtService);
      (jwtService.sign as jest.Mock).mockClear();
      await service.login({ email: 'engineer@test.com', password: 'Password123!' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ org_id: ORG_ID }),
      );
    });
  });
});
