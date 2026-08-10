export interface Integration {
  id: string;
  name: string;
  type: 'github' | 'gitlab' | 'google_calendar' | 'zoom' | 'slack' | 'discord' | 'stripe' | 'quickbooks' | 'drive' | 'onedrive';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationDto {
  type: string;
  config: Record<string, any>;
}

export interface UpdateIntegrationDto {
  config?: Record<string, any>;
  status?: 'connected' | 'disconnected';
}

export interface IntegrationTemplate {
  type: string;
  name: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select';
  required: boolean;
  options?: string[];
}
