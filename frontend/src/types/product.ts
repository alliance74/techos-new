export interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'idea' | 'planned' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  epicId?: string;
  epic?: Epic;
  votes: number;
  requestedById?: string;
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  releaseId?: string;
  release?: Release;
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  progress: number;
  features?: Feature[];
  createdAt: string;
  updatedAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedById: string;
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assigneeId?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  stepsToReproduce?: string;
  environment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  status: 'planning' | 'development' | 'testing' | 'released' | 'cancelled';
  releaseDate?: string;
  features?: Feature[];
  bugs?: Bug[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureDto {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  epicId?: string;
  assigneeId?: string;
}

export interface UpdateFeatureDto {
  title?: string;
  description?: string;
  status?: 'idea' | 'planned' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  epicId?: string;
  assigneeId?: string;
  releaseId?: string;
}

export interface CreateBugDto {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  stepsToReproduce?: string;
  environment?: string;
  assigneeId?: string;
}

export interface UpdateBugDto {
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
}

export interface CreateReleaseDto {
  version: string;
  name: string;
  description: string;
  releaseDate?: string;
}

export interface UpdateReleaseDto {
  version?: string;
  name?: string;
  description?: string;
  status?: 'planning' | 'development' | 'testing' | 'released' | 'cancelled';
  releaseDate?: string;
}
