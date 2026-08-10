export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'company' | 'department' | 'team' | 'individual';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  parentGoalId?: string;
  parentGoal?: Goal;
  keyResults?: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  type: 'numeric' | 'percentage' | 'boolean';
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  progress: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  title: string;
  description: string;
  type: 'company' | 'department' | 'team' | 'individual';
  startDate: string;
  endDate: string;
  ownerId?: string;
  parentGoalId?: string;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  progress?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateKeyResultDto {
  goalId: string;
  title: string;
  description?: string;
  type: 'numeric' | 'percentage' | 'boolean';
  startValue: number;
  targetValue: number;
  unit?: string;
  dueDate: string;
}

export interface UpdateKeyResultDto {
  title?: string;
  description?: string;
  currentValue?: number;
  status?: 'on_track' | 'at_risk' | 'behind' | 'completed';
  dueDate?: string;
}
