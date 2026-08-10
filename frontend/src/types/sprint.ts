export interface Sprint {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed';
  velocity?: number;
  created_at: string;
}

export interface SprintTask {
  id: string;
  sprint_id: string;
  task_id: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    story_points?: number;
    estimated_hours?: number;
  };
}

export interface SprintStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  total_story_points: number;
  completed_story_points: number;
  completion_percentage: number;
}
