export interface Task {
  id: string;
  org_id: string;
  project_id: string;
  sprint_id?: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id?: string;
  assignee_ids?: string[];
  reporter_id?: string;
  estimated_hours?: number;
  time_logged?: number;
  story_points?: number;
  due_date?: string;
  dependencies?: string[];
  tags?: string[];
  created_at: string;
}

export interface SubTask {
  id: string;
  parent_task_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
}
