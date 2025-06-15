
import React from 'react';
import { Language } from '@/types/chat';
import { Project } from '@/types/integrations';
import { Github, GitBranch, Settings, Database, Folder, Server, Shield, CheckCircle } from 'lucide-react';

interface SelectedRepositoryDisplayProps {
  language: Language;
  selectedRepository: { source: string; project: Project };
}

const SelectedRepositoryDisplay: React.FC<SelectedRepositoryDisplayProps> = ({
  language,
  selectedRepository
}) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'devops':
        return <Settings className="w-4 h-4" />;
      case 'devops-user':
        return <Server className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'bitbucket':
        return <GitBranch className="w-4 h-4" />;
      case 'jira':
      case 'clickup':
        return <Database className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const getSourceName = (source: string) => {
    const names = {
      'ar': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'devops-user': 'مستخدم DevOps',
        'security': 'مستخدم الأمان',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      },
      'en': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'devops-user': 'DevOps User',
        'security': 'Security User',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      }
    };
    return names[language][source as keyof typeof names[typeof language]] || source;
  };

  return (
    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center space-x-2 mb-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">
          {language === 'ar' ? 'المستودع المحدد' : 'Selected Repository'}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {getSourceIcon(selectedRepository.source)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-700 truncate">
            {selectedRepository.project.name}
          </p>
          <p className="text-xs text-green-600">
            {getSourceName(selectedRepository.source)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectedRepositoryDisplay;
