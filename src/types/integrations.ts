
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
  selectedProjects?: string[];
}

export interface IntegrationSettings {
  [key: string]: {
    apiKey?: string;
    serverUrl?: string;
    projectKey?: string;
    workspaceId?: string;
    username?: string;
    enabled: boolean;
    selectedProjects?: string[];
  };
}

export type IntegrationType = 'axure' | 'jira' | 'clickup' | 'devops' | 'bitbucket';

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
    projectSelection?: boolean;
  };
  color: string;
}

export interface Project {
  id: string;
  name: string;
  key?: string;
  description?: string;
  status?: string;
  lastActivity?: string;
}
