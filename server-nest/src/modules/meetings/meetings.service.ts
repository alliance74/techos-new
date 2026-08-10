import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Meeting } from '../../entities/meeting.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { MeetingActionItem } from '../../entities/meeting-action-item.entity';
import { User } from '../../entities/user.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { EmailService } from '../../common/services/email.service';
import { assertOrgAdmin, isOrgAdmin } from '../../common/utils/org-admin';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private participantsRepository: Repository<MeetingParticipant>,
    @InjectRepository(MeetingActionItem)
    private actionItemsRepository: Repository<MeetingActionItem>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  private userLabel(user?: User | null) {
    if (!user) return null;
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || null;
  }

  private async assertCanAccessMeeting(
    meeting_id: string,
    org_id: string,
    user?: { id?: string; role?: string },
  ) {
    if (isOrgAdmin(user?.role)) return;
    const membership = await this.participantsRepository.findOne({
      where: { meeting_id, user_id: user?.id },
    });
    if (!membership) {
      throw new ForbiddenException('You are not invited to this meeting');
    }
  }

  async create(org_id: string, actor: { id: string; role?: string }, createMeetingDto: CreateMeetingDto) {
    assertOrgAdmin(actor, 'create meetings');

    const { participant_ids, ...meetingData } = createMeetingDto;
    const viewers = [
      ...new Set(
        (participant_ids || []).filter(
          (id): id is string => typeof id === 'string' && !!id.trim() && id !== actor.id,
        ),
      ),
    ];
    if (!viewers.length) {
      throw new BadRequestException('Select at least one viewer for this meeting');
    }

    const meeting = this.meetingsRepository.create({
      id: randomUUID(),
      org_id,
      ...meetingData,
      scheduled_at: `${meetingData.date}T${meetingData.start_time}:00.000Z`,
      organizer_id: actor.id,
      status: 'scheduled',
    });

    await this.meetingsRepository.save(meeting);

    try {
      await this.addParticipant(meeting.id, actor.id, true);
    } catch {
      /* non-fatal */
    }

    await Promise.all(
      viewers.map((participantId) =>
        this.addParticipant(meeting.id, participantId, false).catch(() => null),
      ),
    );

    try {
      await this.sendMeetingInvites(meeting, viewers);
    } catch {
      /* non-fatal */
    }

    return {
      success: true,
      data: meeting,
    };
  }

  async findAll(org_id: string, user?: { id?: string; role?: string }, filters?: any) {
    const where: any = { org_id };

    if (filters?.status) {
      where.status = filters.status;
    }

    let meetings = await this.meetingsRepository.find({ where });

    if (!isOrgAdmin(user?.role) && user?.id) {
      const memberships = await this.participantsRepository.find({
        where: { user_id: user.id },
      });
      const allowed = new Set(memberships.map((m) => m.meeting_id));
      meetings = meetings.filter((m) => allowed.has(m.id) || m.organizer_id === user.id);
    }

    const meetingsWithData = await Promise.all(
      meetings.map(async (meeting) => {
        const participantCount = await this.participantsRepository.count({
          where: { meeting_id: meeting.id },
        });

        const actionItemCount = await this.actionItemsRepository.count({
          where: { meeting_id: meeting.id },
        });

        const participantRows = await this.participantsRepository.find({
          where: { meeting_id: meeting.id },
        });

        return {
          ...meeting,
          participant_count: participantCount,
          action_item_count: actionItemCount,
          participant_ids: participantRows.map((p) => p.user_id),
        };
      }),
    );

    return {
      success: true,
      data: meetingsWithData,
    };
  }

  async findOne(id: string, org_id: string, user?: { id?: string; role?: string }) {
    const meeting = await this.meetingsRepository.findOne({
      where: { id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    await this.assertCanAccessMeeting(id, org_id, user);

    const [participantRows, actionItemRows] = await Promise.all([
      this.participantsRepository.find({ where: { meeting_id: id } }),
      this.actionItemsRepository.find({ where: { meeting_id: id } }),
    ]);

    const userIds = [
      ...new Set(
        [
          ...participantRows.map((p) => p.user_id),
          ...actionItemRows.map((a) => a.assignee_id),
          meeting.organizer_id,
        ].filter(Boolean),
      ),
    ];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const participants = participantRows.map((p) => {
      const u = userMap.get(p.user_id);
      return {
        id: p.id,
        user_id: p.user_id,
        status: p.status,
        is_organizer: p.is_organizer,
        first_name: u?.first_name || null,
        last_name: u?.last_name || null,
        email: u?.email || null,
        avatar: u?.avatar || null,
        name: this.userLabel(u),
      };
    });

    const action_items = actionItemRows.map((item) => {
      const u = userMap.get(item.assignee_id);
      return {
        ...item,
        assignee_first_name: u?.first_name || null,
        assignee_last_name: u?.last_name || null,
        assignee_name: this.userLabel(u),
      };
    });

    const organizer = userMap.get(meeting.organizer_id);

    return {
      success: true,
      data: {
        ...meeting,
        organizer_name: this.userLabel(organizer),
        owner: this.userLabel(organizer) || meeting.organizer_id,
        participants,
        participant_ids: participantRows.map((p) => p.user_id),
        action_items,
      },
    };
  }

  async update(
    id: string,
    org_id: string,
    updateMeetingDto: UpdateMeetingDto,
    user?: { id?: string; role?: string },
  ) {
    assertOrgAdmin(user, 'update meetings');
    const meeting = await this.meetingsRepository.findOne({
      where: { id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    Object.assign(meeting, updateMeetingDto);
    await this.meetingsRepository.save(meeting);

    return {
      success: true,
      data: (await this.findOne(id, org_id, user)).data,
    };
  }

  async remove(id: string, org_id: string, user?: { id?: string; role?: string }) {
    assertOrgAdmin(user, 'delete meetings');
    const meeting = await this.meetingsRepository.findOne({
      where: { id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Delete participants
    await this.participantsRepository.delete({ meeting_id: id });

    // Delete action items
    await this.actionItemsRepository.delete({ meeting_id: id });

    // Delete meeting
    await this.meetingsRepository.remove(meeting);

    return {
      success: true,
      message: 'Meeting deleted successfully',
    };
  }

  // Participant Management
  async addParticipant(meeting_id: string, user_id: string, is_organizer: boolean = false) {
    const participant = this.participantsRepository.create({
      id: randomUUID(),
      meeting_id,
      user_id,
      is_organizer,
      status: 'pending',
    });

    await this.participantsRepository.save(participant);
    return participant;
  }

  async addParticipants(meeting_id: string, org_id: string, participant_ids: string[]) {
    // Verify meeting exists and belongs to org
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meeting_id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Add participants
    await Promise.all(
      participant_ids.map((userId) => this.addParticipant(meeting_id, userId, false)),
    );

    // Send invites
    await this.sendMeetingInvites(meeting, participant_ids);

    return {
      success: true,
      message: 'Participants added successfully',
    };
  }

  async removeParticipant(meeting_id: string, org_id: string, user_id: string) {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meeting_id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    await this.participantsRepository.delete({ meeting_id, user_id });

    return {
      success: true,
      message: 'Participant removed successfully',
    };
  }

  async updateParticipantStatus(
    meeting_id: string,
    user_id: string,
    status: 'accepted' | 'declined',
  ) {
    const participant = await this.participantsRepository.findOne({
      where: { meeting_id, user_id },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.status = status;
    await this.participantsRepository.save(participant);

    return {
      success: true,
      data: participant,
    };
  }

  // Action Items Management
  async createActionItem(
    meeting_id: string,
    org_id: string,
    createActionItemDto: CreateActionItemDto,
  ) {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meeting_id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const actionItem = this.actionItemsRepository.create({
      id: randomUUID(),
      meeting_id,
      ...createActionItemDto,
      status: 'pending',
    });

    await this.actionItemsRepository.save(actionItem);

    return {
      success: true,
      data: actionItem,
    };
  }

  async updateActionItem(id: string, meeting_id: string, updateData: Partial<MeetingActionItem>) {
    const actionItem = await this.actionItemsRepository.findOne({
      where: { id, meeting_id },
    });

    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    Object.assign(actionItem, updateData);
    await this.actionItemsRepository.save(actionItem);

    return {
      success: true,
      data: actionItem,
    };
  }

  async updateActionItemById(id: string, org_id: string, updateData: Partial<MeetingActionItem>) {
    const actionItem = await this.actionItemsRepository.findOne({ where: { id } });
    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    const meeting = await this.meetingsRepository.findOne({
      where: { id: actionItem.meeting_id, org_id },
    });
    if (!meeting) {
      throw new NotFoundException('Action item not found');
    }

    await this.actionItemsRepository.update(id, updateData);
    const updated = await this.actionItemsRepository.findOne({ where: { id } });
    return { success: true, data: updated };
  }

  async getActionItems(meeting_id: string, org_id: string) {
    const meeting = await this.meetingsRepository.findOne({
      where: { id: meeting_id, org_id },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const actionItems = await this.actionItemsRepository.find({
      where: { meeting_id },
      order: { created_at: 'DESC' },
    });

    return { success: true, data: actionItems };
  }

  async deleteActionItem(id: string, meeting_id: string) {
    const actionItem = await this.actionItemsRepository.findOne({
      where: { id, meeting_id },
    });

    if (!actionItem) {
      throw new NotFoundException('Action item not found');
    }

    await this.actionItemsRepository.remove(actionItem);

    return {
      success: true,
      message: 'Action item deleted successfully',
    };
  }

  // Email notifications
  private async sendMeetingInvites(meeting: Meeting, participant_ids: string[]) {
    const participants = await this.usersRepository.find({
      where: participant_ids.map((id) => ({ id })),
    });

    const emails = participants.map((p) => p.email);
    const startDateTime = `${meeting.date} ${meeting.start_time}`;

    await this.emailService.sendMeetingInviteEmail(
      emails,
      meeting.title,
      startDateTime,
      meeting.meeting_link,
    );
  }
}
