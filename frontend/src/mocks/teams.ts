export type TeamStatus = 'active' | 'forming' | 'archived';

export interface TeamMemberRef {
  userId: string;
  roleInTeam: 'lead' | 'member';
}

export interface Team {
  id: string;
  name: string;
  description: string;
  status: TeamStatus;
  leadId: string;
  memberIds: string[];
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** No demo teams — use `/workspace/teams` via React Query. */
export const seedTeams: Team[] = [];

export function getTeamPeople() {
  return [] as { id: string; name: string; title: string }[];
}

export function getTeamProjects() {
  return [] as { id: string; title: string }[];
}

export function resolveTeamMembers(_memberIds: string[]) {
  return [] as { id: string; name: string; title: string }[];
}
