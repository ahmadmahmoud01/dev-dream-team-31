
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  role: 'user' | 'assistant';
  aiRole?: 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'generate-srs' | 'cost-accountant';
  assignedAgent?: string;
  showAzureDevOpsPrompt?: boolean; // Add this new field
  buttons?: Array<{
    id: string;
    text: string;
    action: string;
  }>;
}

export interface ConversationMemory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;  
  role: 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'generate-srs' | 'cost-accountant';
  isDynamic?: true;
}

export interface AIAgent {
  id: string;
  name: string;
  role: AIRole;
  description: string;
  isActive: boolean;
  currentTask?: string;
  completedTasks: string[];
  assignedProjects: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedAgent?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  dependencies: string[];
}

export type AIRole = 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'generate-srs' | 'cost-accountant';
export type Language = 'ar' | 'en';
