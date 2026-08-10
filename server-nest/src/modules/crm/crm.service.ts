import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Contact } from '../../entities/contact.entity';
import { Deal } from '../../entities/deal.entity';
import { User } from '../../entities/user.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateDealDto } from './dto/create-deal.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(Deal)
    private dealsRepository: Repository<Deal>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

  // Contacts
  async createContact(org_id: string, createContactDto: CreateContactDto) {
    const contact = this.contactsRepository.create({
      id: randomUUID(),
      org_id,
      ...createContactDto,
      type: createContactDto.type || 'lead',
      status: createContactDto.status || 'active',
    });

    await this.contactsRepository.save(contact);

    return {
      success: true,
      data: contact,
    };
  }

  async findAllContacts(org_id: string, filters?: any) {
    const where: any = { org_id };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const contacts = await this.contactsRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    // Get deal counts for each contact
    const contactsWithDeals = await Promise.all(
      contacts.map(async (contact) => {
        const dealCount = await this.dealsRepository.count({
          where: { contact_id: contact.id },
        });

        const totalValue = await this.dealsRepository
          .createQueryBuilder('deal')
          .select('SUM(deal.value)', 'total')
          .where('deal.contact_id = :contactId', { contactId: contact.id })
          .andWhere('deal.stage = :stage', { stage: 'closed_won' })
          .getRawOne();

        return {
          ...contact,
          deal_count: dealCount,
          total_revenue: totalValue?.total || 0,
        };
      }),
    );

    return {
      success: true,
      data: contactsWithDeals,
    };
  }

  async findOneContact(id: string, org_id: string) {
    const contact = await this.contactsRepository.findOne({
      where: { id, org_id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Get associated deals (avoid SQL join: deals.assigned_to is varchar, users.id is uuid)
    const deals = await this.dealsRepository.find({
      where: { contact_id: id, org_id },
      order: { created_at: 'DESC' },
    });

    const ownerIds = [...new Set(deals.map((d) => d.assigned_to).filter(Boolean))];
    const owners = ownerIds.length
      ? await this.usersRepository.find({ where: { id: In(ownerIds) } })
      : [];
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    const dealsWithOwners = deals.map((deal) => {
      const owner = ownerMap.get(deal.assigned_to);
      return {
        ...deal,
        assigned_first_name: owner?.first_name || null,
        assigned_last_name: owner?.last_name || null,
        owner_name: owner
          ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email
          : '—',
      };
    });

    return {
      success: true,
      data: {
        ...contact,
        deals: dealsWithOwners,
      },
    };
  }

  async updateContact(id: string, org_id: string, updateData: Partial<Contact> & Record<string, any>) {
    const contact = await this.contactsRepository.findOne({
      where: { id, org_id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const {
      company,
      description,
      title: _title,
      owner: _owner,
      owner_name: _ownerName,
      statusVariant: _sv,
      createdAt: _ca,
      updatedAt: _ua,
      amount: _amount,
      dueDate: _due,
      ...rest
    } = updateData || {};

    Object.assign(contact, {
      ...rest,
      ...(company != null ? { company_name: company } : {}),
      ...(description != null ? { notes: description } : {}),
    });
    await this.contactsRepository.save(contact);

    return {
      success: true,
      data: contact,
    };
  }

  async deleteContact(id: string, org_id: string) {
    const contact = await this.contactsRepository.findOne({
      where: { id, org_id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.contactsRepository.remove(contact);

    return {
      success: true,
      message: 'Contact deleted successfully',
    };
  }

  // Deals
  async createDeal(org_id: string, createDealDto: CreateDealDto, actor?: any) {
    let contact_id = createDealDto.contact_id;
    if (contact_id) {
      const contact = await this.contactsRepository.findOne({
        where: { id: contact_id, org_id },
      });
      if (!contact) {
        throw new NotFoundException('Contact not found');
      }
    } else {
      const companyName =
        createDealDto.company_name || createDealDto.company || createDealDto.title;
      const contact = this.contactsRepository.create({
        id: randomUUID(),
        org_id,
        first_name: createDealDto.contact_first_name || 'Deal',
        last_name: createDealDto.contact_last_name || 'Lead',
        ...(createDealDto.email ? { email: createDealDto.email } : {}),
        ...(createDealDto.phone ? { phone: createDealDto.phone } : {}),
        company_name: companyName,
        type: 'lead',
        status: 'qualified',
        notes: createDealDto.notes || createDealDto.description,
      });
      await this.contactsRepository.save(contact);
      contact_id = contact.id;
    }

    const deal = this.dealsRepository.create({
      id: randomUUID(),
      org_id,
      contact_id,
      title: createDealDto.title,
      value: Number(createDealDto.value || 0),
      stage: createDealDto.stage || 'qualification',
      currency: createDealDto.currency || 'USD',
      probability: createDealDto.probability || 0,
      expected_close_date: createDealDto.expected_close_date,
      assigned_to: createDealDto.assigned_to || actor?.id,
      notes: createDealDto.notes || createDealDto.description,
    });

    await this.dealsRepository.save(deal);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'deals',
      resource_id: deal.id,
      summary: `created deal "${deal.title || 'Untitled'}"`,
    });

    return {
      success: true,
      data: deal,
    };
  }

  async findAllDeals(org_id: string, filters?: any) {
    const where: any = { org_id };

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    if (filters?.assigned_to) {
      where.assigned_to = filters.assigned_to;
    }

    const deals = await this.dealsRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    const ownerIds = [...new Set(deals.map((d) => d.assigned_to).filter(Boolean))];
    const owners = ownerIds.length
      ? await this.usersRepository.find({ where: { id: In(ownerIds) } })
      : [];
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    const contactIds = [...new Set(deals.map((d) => d.contact_id).filter(Boolean))];
    const contacts = contactIds.length
      ? await this.contactsRepository.find({ where: { id: In(contactIds) } })
      : [];
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    const data = deals.map((deal) => {
      const owner = ownerMap.get(deal.assigned_to);
      const contact = contactMap.get(deal.contact_id);
      const owner_name = owner
        ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email
        : '—';
      return {
        ...deal,
        owner_name,
        assigned_to: deal.assigned_to,
        company_name: contact?.company_name || null,
        email: contact?.email || null,
        phone: contact?.phone || null,
        contact_first_name: contact?.first_name || null,
        contact_last_name: contact?.last_name || null,
        updated_at: deal.created_at,
      };
    });

    return {
      success: true,
      data,
    };
  }

  async findOneDeal(id: string, org_id: string) {
    const deal = await this.dealsRepository.findOne({
      where: { id, org_id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const [owner, contact] = await Promise.all([
      deal.assigned_to
        ? this.usersRepository.findOne({ where: { id: deal.assigned_to } })
        : Promise.resolve(null),
      deal.contact_id
        ? this.contactsRepository.findOne({ where: { id: deal.contact_id } })
        : Promise.resolve(null),
    ]);

    const owner_name = owner
      ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email
      : '—';

    return {
      success: true,
      data: {
        ...deal,
        owner_name,
        company_name: contact?.company_name || null,
        email: contact?.email || null,
        phone: contact?.phone || null,
        contact_first_name: contact?.first_name || null,
        contact_last_name: contact?.last_name || null,
        updated_at: deal.created_at,
      },
    };
  }

  async updateDeal(id: string, org_id: string, updateData: Partial<Deal> & Record<string, any>, actor?: any) {
    const deal = await this.dealsRepository.findOne({
      where: { id, org_id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const {
      company,
      company_name,
      email,
      phone,
      contact_first_name,
      contact_last_name,
      description,
      amount,
      owner,
      owner_id,
      owner_name: _ownerName,
      status,
      dueDate,
      title: formTitle,
      notes: formNotes,
      value: formValue,
      stage: formStage,
      assigned_to: formAssigned,
      expected_close_date: formClose,
      ...rest
    } = updateData || {};

    const nextStageRaw = String(formStage || status || deal.stage || '')
      .toLowerCase()
      .replace(/\s+/g, '_');
    const allowed = new Set(['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']);
    const stageMap: Record<string, string> = {
      won: 'closed_won',
      lost: 'closed_lost',
      closedwon: 'closed_won',
      closedlost: 'closed_lost',
    };
    const mappedStage = stageMap[nextStageRaw.replace(/_/g, '')] || nextStageRaw;

    Object.assign(deal, {
      ...rest,
      ...(formTitle != null ? { title: formTitle } : {}),
      ...(formNotes != null || description != null
        ? { notes: formNotes ?? description }
        : {}),
      ...(formValue != null || amount != null
        ? { value: Number(formValue ?? amount) }
        : {}),
      ...(mappedStage && allowed.has(mappedStage) ? { stage: mappedStage } : {}),
      ...(formAssigned || owner_id || owner
        ? { assigned_to: formAssigned || owner_id || owner }
        : {}),
      ...(formClose != null || dueDate != null
        ? { expected_close_date: formClose ?? dueDate }
        : {}),
    });
    await this.dealsRepository.save(deal);

    if (
      deal.contact_id &&
      (company != null ||
        company_name != null ||
        email != null ||
        phone != null ||
        contact_first_name != null ||
        contact_last_name != null)
    ) {
      const contact = await this.contactsRepository.findOne({
        where: { id: deal.contact_id, org_id },
      });
      if (contact) {
        if (company != null || company_name != null) {
          contact.company_name = company_name ?? company;
        }
        if (email != null) contact.email = email;
        if (phone != null) contact.phone = phone;
        if (contact_first_name != null) contact.first_name = contact_first_name;
        if (contact_last_name != null) contact.last_name = contact_last_name;
        await this.contactsRepository.save(contact);
      }
    }

    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'deals',
      resource_id: deal.id,
      summary: `updated deal "${deal.title || 'Untitled'}"`,
      changes: updateData as any,
    });

    return this.findOneDeal(id, org_id);
  }

  async deleteDeal(id: string, org_id: string, actor?: any) {
    const deal = await this.dealsRepository.findOne({
      where: { id, org_id },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    const title = deal.title;
    await this.dealsRepository.remove(deal);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'deleted',
      resource_type: 'deals',
      resource_id: id,
      summary: `deleted deal "${title || 'Untitled'}"`,
    });

    return {
      success: true,
      message: 'Deal deleted successfully',
    };
  }

  // Pipeline Analytics
  async getPipelineStats(org_id: string) {
    const stages = ['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    
    const stats = await Promise.all(
      stages.map(async (stage) => {
        const result = await this.dealsRepository
          .createQueryBuilder('deal')
          .select('COUNT(*)', 'count')
          .addSelect('SUM(deal.value)', 'total_value')
          .where('deal.org_id = :org_id', { org_id })
          .andWhere('deal.stage = :stage', { stage })
          .getRawOne();

        return {
          stage,
          count: parseInt(result.count) || 0,
          total_value: parseFloat(result.total_value) || 0,
        };
      }),
    );

    // Calculate win rate
    const wonCount = stats.find(s => s.stage === 'closed_won')?.count || 0;
    const lostCount = stats.find(s => s.stage === 'closed_lost')?.count || 0;
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

    return {
      success: true,
      data: {
        pipeline: stats,
        win_rate: winRate.toFixed(2),
        total_deals: stats.reduce((sum, s) => sum + s.count, 0),
        total_pipeline_value: stats
          .filter(s => !['closed_won', 'closed_lost'].includes(s.stage))
          .reduce((sum, s) => sum + s.total_value, 0),
        total_revenue: stats.find(s => s.stage === 'closed_won')?.total_value || 0,
      },
    };
  }

  // Lead Scoring (simple algorithm)
  async scoreContact(contact_id: string, org_id: string) {
    const contact = await this.contactsRepository.findOne({
      where: { id: contact_id, org_id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    let score = 0;

    // Email exists: +20
    if (contact.email) score += 20;

    // Phone exists: +10
    if (contact.phone) score += 10;

    // Company name exists: +15
    if (contact.company_name) score += 15;

    // Has deals: +25 per deal
    const dealCount = await this.dealsRepository.count({
      where: { contact_id },
    });
    score += dealCount * 25;

    // Recent activity (created in last 30 days): +20
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (new Date(contact.created_at) > thirtyDaysAgo) {
      score += 20;
    }

    // Cap at 100
    score = Math.min(score, 100);

    return {
      success: true,
      data: {
        contact_id,
        score,
        rating: score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      },
    };
  }
}
