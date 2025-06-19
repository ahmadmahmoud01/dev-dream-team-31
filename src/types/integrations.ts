export interface TeamMember {
  id: string;
  email: string;
  role: 'frontend' | 'backend' | 'tester' | 'fullstack' | 'devops';
  displayName?: string;
}

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
  personalAccessToken?: string;
  organizationUrl?: string;
  projectName?: string;
  teamMembers?: TeamMember[];
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
    personalAccessToken?: string;
    organizationUrl?: string;
    projectName?: string;
    teamMembers?: TeamMember[];
  };
}

export interface AzureDevOpsConfig {
  personalAccessToken: string;
  organizationUrl: string;
  projectName: string;
  teamMembers: TeamMember[];
  enabled: boolean;
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
    projectName?: boolean; // For Azure DevOps
    projectSelection?: boolean;
    personalAccessToken?: boolean;
    organizationUrl?: boolean;
    teamMembers?: boolean; // New field for dynamic team member management
    testConnection?: boolean; // New field for testing connection
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
