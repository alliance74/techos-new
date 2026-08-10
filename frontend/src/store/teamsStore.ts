import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Team, type TeamStatus } from '@/mocks/teams';

export interface CreateTeamInput {
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  projectIds: string[];
  status?: TeamStatus;
}

interface TeamsState {
  teams: Team[];
  createTeam: (input: CreateTeamInput) => Team;
  updateTeam: (id: string, patch: Partial<CreateTeamInput>) => void;
  assignProjects: (teamId: string, projectIds: string[]) => void;
  removeTeam: (id: string) => void;
  getTeam: (id: string) => Team | undefined;
}

export const useTeamsStore = create<TeamsState>()(
  persist(
    (set, get) => ({
      teams: [],

      createTeam: (input) => {
        const now = new Date().toISOString();
        const memberIds = Array.from(new Set([input.leadId, ...input.memberIds]));
        const team: Team = {
          id: `team-${Date.now()}`,
          name: input.name.trim(),
          description: input.description.trim(),
          status: input.status || 'forming',
          leadId: input.leadId,
          memberIds,
          projectIds: [...input.projectIds],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ teams: [team, ...state.teams] }));
        return team;
      },

      updateTeam: (id, patch) => {
        set((state) => ({
          teams: state.teams.map((team) => {
            if (team.id !== id) return team;
            const leadId = patch.leadId ?? team.leadId;
            const memberIds = patch.memberIds
              ? Array.from(new Set([leadId, ...patch.memberIds]))
              : team.memberIds.includes(leadId)
                ? team.memberIds
                : [leadId, ...team.memberIds];
            return {
              ...team,
              name: patch.name?.trim() ?? team.name,
              description: patch.description?.trim() ?? team.description,
              status: patch.status ?? team.status,
              leadId,
              memberIds,
              projectIds: patch.projectIds ?? team.projectIds,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      assignProjects: (teamId, projectIds) => {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId
              ? { ...team, projectIds: [...projectIds], updatedAt: new Date().toISOString() }
              : team,
          ),
        }));
      },

      removeTeam: (id) => {
        set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }));
      },

      getTeam: (id) => get().teams.find((t) => t.id === id),
    }),
    { name: 'techos-teams-v2' },
  ),
);
