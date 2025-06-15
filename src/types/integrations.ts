
export interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  isConnected: boolean;
  apiKey?: string;
  serverUrl?: string;
  projectKey?: string;
  workspaceId?: string;
  lastSync?: Date;
}

export interface IntegrationSettings {
  [key: string]: {
    apiKey?: string;
    serverUrl?: string;
    projectKey?: string;
    workspaceId?: string;
    username?: string;
    enabled: boolean;
  };
}

export type IntegrationType = 'axure' | 'jira' | 'clickup' | 'devops';

export interface IntegrationConfig {
  id: IntegrationType;
  name: string;
  icon: string;
  description: string;
  fields: {
    apiKey?: boolean;
    serverUrl?: boolean;
    projectKey?: boolean;
    workspaceId?: boolean;
    username?: boolean;
  };
  color: string;
}
