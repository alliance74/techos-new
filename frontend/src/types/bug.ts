export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
export type BugPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Bug {
  id: number;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  priority: BugPriority;
  assigneeId?: number;
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  reporterId: number;
  reporter: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  projectId?: number;
  project?: {
    id: number;
    name: string;
  };
  epicId?: number;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  environment?: string;
  tags?: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBugDto {
  title: string;
  description: string;
  severity: BugSeverity;
  priority: BugPriority;
  assigneeId?: number;
  projectId?: number;
  epicId?: number;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  environment?: string;
  tags?: string[];
}

export interface UpdateBugDto extends Partial<CreateBugDto> {
  status?: BugStatus;
}
