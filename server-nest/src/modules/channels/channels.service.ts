import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Channel } from '../../entities/channel.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { User } from '../../entities/user.entity';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private membersRepository: Repository<ChannelMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /** Ensure the user has at least #general so messaging works out of the box. */
  private async ensureDefaultChannel(org_id: string, user_id: string) {
    const memberships = await this.membersRepository.count({ where: { user_id } });
    if (memberships > 0) return;

    const defaults = [
      { name: 'general', description: 'Company-wide announcements and chat' },
      { name: 'engineering', description: 'Dev team discussion — PRs, deploys, architecture' },
      { name: 'standup', description: 'Daily standup updates and blockers' },
    ];

    for (const def of defaults) {
      let channel = await this.channelsRepository.findOne({
        where: { org_id, name: def.name },
      });
      if (!channel) {
        channel = this.channelsRepository.create({
          id: randomUUID(),
          org_id,
          name: def.name,
          description: def.description,
          type: 'public',
          created_by: user_id,
        });
        await this.channelsRepository.save(channel);
      }
      await this.addMember(channel.id, user_id, def.name === 'general' ? 'admin' : 'member');
    }
  }

  /** Open or reuse a 1:1 DM between two users. */
  async findOrCreateDirect(org_id: string, user_id: string, other_user_id: string) {
    if (!other_user_id || other_user_id === user_id) {
      throw new ForbiddenException('Pick another teammate for a direct message');
    }

    const other = await this.usersRepository.findOne({ where: { id: other_user_id } });
    if (!other) throw new NotFoundException('User not found');

    const myMemberships = await this.membersRepository.find({ where: { user_id } });
    const myChannelIds = myMemberships.map((m) => m.channel_id);
    if (myChannelIds.length) {
      const directChannels = await this.channelsRepository.find({
        where: { org_id, type: 'direct', id: In(myChannelIds) as any },
      });
      for (const channel of directChannels) {
        const members = await this.membersRepository.find({ where: { channel_id: channel.id } });
        const ids = members.map((m) => m.user_id).sort();
        const expected = [user_id, other_user_id].sort();
        if (ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]) {
          return {
            success: true,
            data: await this.findOne(channel.id, org_id, user_id),
          };
        }
      }
    }

    const label =
      `${other.first_name || ''} ${other.last_name || ''}`.trim() || other.email || 'Direct message';
    const channel = this.channelsRepository.create({
      id: randomUUID(),
      org_id,
      name: label,
      description: 'Direct message',
      type: 'direct',
      created_by: user_id,
    });
    await this.channelsRepository.save(channel);
    await this.addMember(channel.id, user_id, 'admin');
    await this.addMember(channel.id, other_user_id, 'member');

    return {
      success: true,
      data: await this.findOne(channel.id, org_id, user_id),
    };
  }

  async create(org_id: string, user_id: string, createChannelDto: CreateChannelDto) {
    const { member_ids, ...channelData } = createChannelDto;

    // Create channel
    const channel = this.channelsRepository.create({
      id: randomUUID(),
      org_id,
      ...channelData,
      created_by: user_id,
      type: channelData.type || 'public',
    });

    await this.channelsRepository.save(channel);

    // Add creator as admin
    await this.addMember(channel.id, user_id, 'admin');

    // Add other members
    if (member_ids && member_ids.length > 0) {
      await Promise.all(
        member_ids.map((memberId) => this.addMember(channel.id, memberId, 'member')),
      );
    }

    return {
      success: true,
      data: await this.findOne(channel.id, org_id, user_id),
    };
  }

  async findAll(org_id: string, user_id: string) {
    await this.ensureDefaultChannel(org_id, user_id);

    // Get all channels user has access to
    const memberChannels = await this.membersRepository.find({
      where: { user_id },
    });

    const channelIds = memberChannels.map((m) => m.channel_id);

    if (channelIds.length === 0) {
      return { success: true, data: [] };
    }

    const channels = await this.channelsRepository
      .createQueryBuilder('channel')
      .where('channel.org_id = :org_id', { org_id })
      .andWhere('channel.id IN (:...channelIds)', { channelIds })
      .getMany();

    // Get member counts and unread counts
    const channelsWithData = await Promise.all(
      channels.map(async (channel) => {
        const memberCount = await this.membersRepository.count({
          where: { channel_id: channel.id },
        });

        const memberData = await this.membersRepository.findOne({
          where: { channel_id: channel.id, user_id },
        });

        return {
          ...channel,
          member_count: memberCount,
          last_read_at: memberData?.last_read_at,
          user_role: memberData?.role,
        };
      }),
    );

    return {
      success: true,
      data: channelsWithData,
    };
  }

  async findOne(id: string, org_id: string, user_id: string) {
    const channel = await this.channelsRepository.findOne({
      where: { id, org_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is a member
    const membership = await this.membersRepository.findOne({
      where: { channel_id: id, user_id },
    });

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You do not have access to this channel');
    }

    // Get members with user details (avoid varchar=uuid SQL joins)
    const memberRows = await this.membersRepository.find({
      where: { channel_id: id },
    });
    const userIds = [...new Set(memberRows.map((m) => m.user_id).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) as any } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const members = memberRows.map((m) => {
      const user = userMap.get(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: (m as any).joined_at || (m as any).created_at,
        first_name: user?.first_name || null,
        last_name: user?.last_name || null,
        email: user?.email || null,
        avatar: user?.avatar || null,
      };
    });

    return {
      success: true,
      data: {
        ...channel,
        members,
        user_role: membership?.role,
      },
    };
  }

  async update(id: string, org_id: string, user_id: string, updateData: Partial<Channel>) {
    const channel = await this.channelsRepository.findOne({
      where: { id, org_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is admin
    const membership = await this.membersRepository.findOne({
      where: { channel_id: id, user_id },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only channel admins can update channel');
    }

    Object.assign(channel, updateData);
    await this.channelsRepository.save(channel);

    return {
      success: true,
      data: channel,
    };
  }

  async remove(id: string, org_id: string, user_id: string) {
    const channel = await this.channelsRepository.findOne({
      where: { id, org_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is admin
    const membership = await this.membersRepository.findOne({
      where: { channel_id: id, user_id },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only channel admins can delete channel');
    }

    // Delete members
    await this.membersRepository.delete({ channel_id: id });

    // Delete channel
    await this.channelsRepository.remove(channel);

    return {
      success: true,
      message: 'Channel deleted successfully',
    };
  }

  // Member Management
  private async addMember(channel_id: string, user_id: string, role: string = 'member') {
    const existing = await this.membersRepository.findOne({
      where: { channel_id, user_id },
    });
    if (existing) return existing;

    const member = this.membersRepository.create({
      id: randomUUID(),
      channel_id,
      user_id,
      role,
    });

    await this.membersRepository.save(member);
    return member;
  }

  async addMembers(channel_id: string, org_id: string, user_id: string, member_ids: string[]) {
    const channel = await this.channelsRepository.findOne({
      where: { id: channel_id, org_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is admin
    const membership = await this.membersRepository.findOne({
      where: { channel_id, user_id },
    });

    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenException('Only channel admins can add members');
    }

    // Add members
    await Promise.all(
      member_ids.map((memberId) => this.addMember(channel_id, memberId, 'member')),
    );

    return {
      success: true,
      message: 'Members added successfully',
    };
  }

  async removeMember(channel_id: string, org_id: string, requesting_user_id: string, user_id: string) {
    const channel = await this.channelsRepository.findOne({
      where: { id: channel_id, org_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if requesting user is admin or removing themselves
    const membership = await this.membersRepository.findOne({
      where: { channel_id, user_id: requesting_user_id },
    });

    if (requesting_user_id !== user_id && (!membership || membership.role !== 'admin')) {
      throw new ForbiddenException('Only channel admins can remove members');
    }

    await this.membersRepository.delete({ channel_id, user_id });

    return {
      success: true,
      message: 'Member removed successfully',
    };
  }

  async updateLastRead(channel_id: string, user_id: string) {
    const member = await this.membersRepository.findOne({
      where: { channel_id, user_id },
    });

    if (member) {
      member.last_read_at = new Date();
      await this.membersRepository.save(member);
    }

    return {
      success: true,
      message: 'Last read updated',
    };
  }
}
