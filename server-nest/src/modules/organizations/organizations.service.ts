import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    const orgs = await this.organizationsRepository.find({
      order: { name: 'ASC' },
    });
    return { success: true, data: orgs };
  }

  async findOne(id: string) {
    const org = await this.organizationsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Get member count
    const memberCount = await this.usersRepository.count({
      where: { org_id: id },
    });

    return {
      success: true,
      data: {
        ...org,
        member_count: memberCount,
      },
    };
  }

  async findBySlug(slug: string) {
    const org = await this.organizationsRepository.findOne({ where: { slug } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return { success: true, data: org };
  }

  async create(dto: CreateOrganizationDto, creator: any) {
    // Check slug uniqueness
    const existing = await this.organizationsRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = this.organizationsRepository.create({
      id: randomUUID(),
      name: dto.name,
      slug: dto.slug,
    });

    await this.organizationsRepository.save(org);

    // Add creator as CEO of the new organization
    if (creator?.id) {
      await this.usersRepository.update(creator.id, {
        org_id: org.id,
        role: 'ceo' as any,
      });
    }

    return { success: true, data: org };
  }

  async update(id: string, updateData: Partial<Organization>, actor?: any) {
    const org = await this.organizationsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Only CEO can update org settings
    if (actor && actor.org_id === id && actor.role !== 'ceo') {
      throw new ForbiddenException('Only the CEO can update organization settings');
    }

    Object.assign(org, updateData);
    await this.organizationsRepository.save(org);
    return { success: true, data: org };
  }

  async getMembers(orgId: string) {
    const members = await this.usersRepository.find({
      where: { org_id: orgId },
      select: ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at'],
      order: { created_at: 'ASC' },
    });
    return { success: true, data: members };
  }

  async join(orgId: string, userId: string) {
    const org = await this.organizationsRepository.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user's organization
    user.org_id = orgId;
    await this.usersRepository.save(user);

    return { success: true, data: org };
  }
}
