
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types/chat';
import { Project } from '@/types/integrations';
import { Github, GitBranch, Settings, Database, Folder, ExternalLink, Loader2 } from 'lucide-react';

interface RepositoryListProps {
  language: Language;
  repositories: { source: string; projects: Project[] }[];
  isLoading: boolean;
  selectedRepository: { source: string; project: Project } | null;
  onSelectRepository: (source: string, project: Project) => void;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  language,
  repositories,
  isLoading,
  selectedRepository,
  onSelectRepository
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>
          {language === 'ar' 
            ? 'لا توجد مستودعات متاحة' 
            : 'No repositories available'
          }
        </p>
        <p className="text-xs mt-2">
          {language === 'ar' 
            ? 'تأكد من ربط حسابك وتحديد المشاريع في إعدادات التكامل' 
            : 'Make sure to connect your account and select projects in integration settings'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {repositories.map((repo) => (
        <div key={repo.source} className="space-y-2">
          <div className="flex items-center space-x-2">
            {getSourceIcon(repo.source)}
            <h4 className="text-sm font-medium">{getSourceName(repo.source)}</h4>
            <Badge variant="outline" className="text-xs">
              {repo.projects.length}
            </Badge>
          </div>
          
          <div className="space-y-2 pl-6">
            {repo.projects.map((project) => (
              <Card 
                key={project.id} 
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedRepository?.project.id === project.id && selectedRepository?.source === repo.source
                    ? 'bg-blue-50 border-blue-200' 
                    : ''
                }`}
                onClick={() => onSelectRepository(repo.source, project)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">
                        {project.name}
                      </span>
                      {project.status && (
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      )}
                    </div>
                    {project.key && (
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'ar' ? 'المفتاح:' : 'Key:'} {project.key}
                      </p>
                    )}
                    {project.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RepositoryList;
