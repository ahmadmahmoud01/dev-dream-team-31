
import { IntegrationConfig } from '@/types/integrations';

export const INTEGRATIONS_CONFIG: IntegrationConfig[] = [
  {
    id: 'axure',
    name: 'Axure DevOps',
    icon: '🎨',
    description: 'تكامل مع Axure لإدارة النماذج الأولية والتصاميم',
    fields: {
      apiKey: true,
      serverUrl: true,
      projectKey: true
    },
    color: 'bg-blue-500'
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: '📋',
    description: 'تكامل مع Jira لإدارة المهام والمشاريع',
    fields: {
      apiKey: true,
      serverUrl: true,
      username: true,
      projectSelection: true
    },
    color: 'bg-blue-600'
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    icon: '✅',
    description: 'تكامل مع ClickUp لإدارة المهام والفرق',
    fields: {
      apiKey: true,
      workspaceId: true,
      projectSelection: true
    },
    color: 'bg-purple-500'
  },
  {
    id: 'devops',
    name: 'Azure DevOps',
    icon: '⚙️',
    description: 'تكامل مع Azure DevOps لإدارة التطوير والنشر - اختر مشاريعك المسجلة',
    fields: {
      apiKey: true,
      serverUrl: true,
      username: true,
      projectSelection: true
    },
    color: 'bg-indigo-500'
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    icon: '🪣',
    description: 'تكامل مع Bitbucket لإدارة الكود والمراجعات - اختر مستودعاتك المسجلة',
    fields: {
      apiKey: true,
      serverUrl: true,
      username: true,
      projectSelection: true
    },
    color: 'bg-blue-700'
  }
];
