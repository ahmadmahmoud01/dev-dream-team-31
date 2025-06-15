
import React from 'react';
import { Language } from '@/types/chat';
import { Project } from '@/types/integrations';
import { Github, GitBranch, Settings, Database, Folder } from 'lucide-react';

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
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      },
      'en': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      }
    };
    return names[language][source as keyof typeof names[typeof language]] || source;
  };

  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2">
        {getSourceIcon(selectedRepository.source)}
        <span className="text-sm font-medium text-blue-800">
          {language === 'ar' ? 'المستودع المحدد:' : 'Selected Repository:'}
        </span>
      </div>
      <p className="text-sm text-blue-700 mt-1">
        {selectedRepository.project.name} ({getSourceName(selectedRepository.source)})
      </p>
    </div>
  );
};

export default SelectedRepositoryDisplay;
