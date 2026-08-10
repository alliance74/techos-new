import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CalendarEvent } from '../../entities/calendar-event.entity';
import { Meeting } from '../../entities/meeting.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private eventsRepository: Repository<CalendarEvent>,
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private participantsRepository: Repository<MeetingParticipant>,
  ) {}

  private normalizeAttendees(attendees: unknown, ownerId: string): string[] {
    const raw = Array.isArray(attendees)
      ? attendees.filter((id): id is string => typeof id === 'string' && !!id.trim())
      : [];
    return [...new Set([ownerId, ...raw])];
  }

  private assertOwns(event: CalendarEvent, user_id: string) {
    if (event.created_by !== user_id) {
      throw new ForbiddenException('You can only manage your own calendar events');
    }
  }

  async create(org_id: string, user_id: string, createEventDto: CreateEventDto) {
    const event = this.eventsRepository.create({
      id: randomUUID(),
      org_id,
      title: createEventDto.title,
      description: createEventDto.description,
      start_datetime: createEventDto.start_datetime,
      end_datetime: createEventDto.end_datetime,
      created_by: user_id,
      all_day: createEventDto.all_day || false,
      type: createEventDto.type || 'event',
      color: createEventDto.color,
      recurrence: createEventDto.recurrence,
      attendees: this.normalizeAttendees(createEventDto.attendees, user_id),
    });

    await this.eventsRepository.save(event);

    return {
      success: true,
      data: { ...event, source: 'personal', can_edit: true },
    };
  }

  /** Personal calendar: own events + events you're an attendee on + invited meetings. */
  async findAll(
    org_id: string,
    user_id: string,
    start_date?: string,
    end_date?: string,
    type?: string,
  ) {
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .where('event.org_id = :org_id', { org_id })
      .andWhere(
        '(event.created_by = :user_id OR CAST(event.attendees AS text) LIKE :user_like)',
        {
          user_id,
          user_like: `%${user_id}%`,
        },
      );

    if (start_date && end_date) {
      queryBuilder.andWhere('event.start_datetime BETWEEN :start AND :end', {
        start: start_date,
        end: end_date,
      });
    }

    if (type) {
      queryBuilder.andWhere('event.type = :type', { type });
    }

    const personal = await queryBuilder.orderBy('event.start_datetime', 'ASC').getMany();

    const personalMapped = personal.map((event) => ({
      ...event,
      source: 'personal' as const,
      can_edit: event.created_by === user_id,
    }));

    // Invited / organized meetings appear on the personal calendar (read-only here)
    const meetingEvents = (
      type && type !== 'meeting'
        ? []
        : await this.getMeetingEventsForUser(org_id, user_id, start_date, end_date)
    ) as Array<Record<string, any>>;

    const merged = [...personalMapped, ...meetingEvents].sort((a, b) =>
      String(a.start_datetime || '').localeCompare(String(b.start_datetime || '')),
    );

    return {
      success: true,
      data: merged,
    };
  }

  private async getMeetingEventsForUser(
    org_id: string,
    user_id: string,
    start_date?: string,
    end_date?: string,
  ) {
    const memberships = await this.participantsRepository.find({ where: { user_id } });
    const memberMeetingIds = memberships.map((m) => m.meeting_id);

    const meetings = await this.meetingsRepository.find({ where: { org_id } });
    const visible = meetings.filter(
      (m) => m.organizer_id === user_id || memberMeetingIds.includes(m.id),
    );

    return visible
      .map((m) => {
        const start =
          m.scheduled_at ||
          (m.date && m.start_time ? `${m.date}T${m.start_time}:00.000Z` : null);
        const end =
          m.date && m.end_time
            ? `${m.date}T${m.end_time}:00.000Z`
            : start;
        if (!start) return null;

        if (start_date && end_date) {
          const t = new Date(start).getTime();
          const from = new Date(start_date).getTime();
          const to = new Date(end_date).getTime();
          if (Number.isFinite(t) && (t < from || t > to)) return null;
        }

        return {
          id: `meeting:${m.id}`,
          org_id: m.org_id,
          title: m.title,
          description: m.agenda || m.description || null,
          start_datetime: start,
          end_datetime: end,
          all_day: false,
          type: 'meeting',
          color: null,
          recurrence: null,
          created_by: m.organizer_id,
          attendees: [],
          created_at: m.created_at,
          location: m.location || m.meeting_link || null,
          source: 'meeting' as const,
          can_edit: false,
          meeting_id: m.id,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }

  async findOne(id: string, org_id: string, user_id: string) {
    if (id.startsWith('meeting:')) {
      throw new NotFoundException('Use the Meetings page for meeting details');
    }

    const event = await this.eventsRepository.findOne({
      where: { id, org_id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isOwner = event.created_by === user_id;
    const isAttendee = Array.isArray(event.attendees) && event.attendees.includes(user_id);
    if (!isOwner && !isAttendee) {
      throw new ForbiddenException('You do not have access to this event');
    }

    return {
      success: true,
      data: { ...event, source: 'personal', can_edit: isOwner },
    };
  }

  async update(id: string, org_id: string, user_id: string, updateData: Partial<CalendarEvent>) {
    if (id.startsWith('meeting:')) {
      throw new ForbiddenException('Invited meetings cannot be edited from your calendar');
    }

    const event = await this.eventsRepository.findOne({
      where: { id, org_id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    this.assertOwns(event, user_id);

    const { id: _id, org_id: _org, created_by: _by, created_at: _at, ...safe } = updateData as any;
    if (safe.attendees !== undefined) {
      safe.attendees = this.normalizeAttendees(safe.attendees, user_id);
    }
    Object.assign(event, safe);
    await this.eventsRepository.save(event);

    return {
      success: true,
      data: { ...event, source: 'personal', can_edit: true },
    };
  }

  async remove(id: string, org_id: string, user_id: string) {
    if (id.startsWith('meeting:')) {
      throw new ForbiddenException('Invited meetings cannot be deleted from your calendar');
    }

    const event = await this.eventsRepository.findOne({
      where: { id, org_id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    this.assertOwns(event, user_id);

    await this.eventsRepository.remove(event);

    return {
      success: true,
      message: 'Event deleted successfully',
    };
  }

  /** Alias kept for /events/my */
  async getUserEvents(org_id: string, user_id: string, start_date?: string, end_date?: string) {
    return this.findAll(org_id, user_id, start_date, end_date);
  }
}
