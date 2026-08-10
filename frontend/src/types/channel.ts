export interface Channel {
  id: string;
  org_id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  last_read_at?: string | null;
  user_role?: 'admin' | 'member';
  is_archived?: boolean;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  channel_id?: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

export interface Message {
  id: string;
  channel_id: string;
  channelId?: string;
  user_id: string;
  userId?: string;
  sender_id?: string;
  content: string;
  text?: string;
  parent_message_id?: string | null;
  has_attachments?: boolean;
  attachments?: string[];
  mentions?: string[];
  reactions?: Record<string, string[]>;
  is_edited?: boolean;
  is_deleted?: boolean;
  thread_count?: number;
  created_at: string;
  createdAt?: string;
  user_name?: string;
  user_first_name?: string | null;
  user_last_name?: string | null;
  user_avatar?: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}
