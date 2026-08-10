import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  async findOne(id: string) {
    const org = await this.organizationsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return { success: true, data: org };
  }

  async update(id: string, updateData: Partial<Organization>) {
    const org = await this.organizationsRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    Object.assign(org, updateData);
    await this.organizationsRepository.save(org);
    return { success: true, data: org };
  }
}
