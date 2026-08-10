import { MockUser } from './types';

/** No demo users — directory comes from `/users` API. */
export const mockUsers: MockUser[] = [];

export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getUsersByRole(role: MockUser['role']): MockUser[] {
  return mockUsers.filter((user) => user.role === role);
}

export function getFullName(user: MockUser): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
