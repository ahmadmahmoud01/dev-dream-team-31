
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiRole?: 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'cost-accountant';
  assignedAgent?: string;
}

export interface ConversationMemory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  role: 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'cost-accountant';
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

export type AIRole = 'product-manager' | 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack' | 'project-manager' | 'cost-accountant';
export type Language = 'ar' | 'en';
