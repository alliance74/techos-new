export interface CalendarEvent {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  is_all_day: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  created_by: string;
  created_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  is_all_day: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
}
