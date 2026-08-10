export interface Meeting {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  agenda?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  is_required: boolean;
  status: 'accepted' | 'declined' | 'pending';
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  description: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed';
  created_at: string;
}
