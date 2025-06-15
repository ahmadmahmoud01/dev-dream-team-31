
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiRole?: 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack';
}

export interface ConversationMemory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  role: 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack';
}

export type AIRole = 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack';
export type Language = 'ar' | 'en';
