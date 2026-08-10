export type ReleaseStatus = 'planned' | 'in_progress' | 'testing' | 'released' | 'cancelled';

export interface Release {
  id: number;
  version: string;
  name: string;
  description?: string;
  status: ReleaseStatus;
  releaseDate?: string;
  plannedDate?: string;
  releaseNotes?: string;
  features?: Array<{
    id: number;
    title: string;
  }>;
  bugs?: Array<{
    id: number;
    title: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseDto {
  version: string;
  name: string;
  description?: string;
  plannedDate?: string;
  releaseNotes?: string;
  featureIds?: number[];
  bugIds?: number[];
}

export interface UpdateReleaseDto extends Partial<CreateReleaseDto> {
  status?: ReleaseStatus;
  releaseDate?: string;
}
