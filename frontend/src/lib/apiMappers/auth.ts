import { UserRole } from '@/types/roles';

export interface BackendAuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  org_id?: string;
  avatar?: string;
  status?: string;
  preferences?: unknown;
}

export interface FrontendAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  name?: string;
  avatar?: string;
  status?: string;
  preferences?: unknown;
}

export function mapBackendUserToFrontend(user: BackendAuthUser): FrontendAuthUser {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    role: user.role,
    organizationId: user.org_id || '',
    name: `${firstName} ${lastName}`.trim(),
    avatar: user.avatar,
    status: user.status,
    preferences: user.preferences,
  };
}
