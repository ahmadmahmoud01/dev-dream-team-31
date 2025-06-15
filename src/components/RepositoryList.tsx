
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types/chat';
import { Project } from '@/types/integrations';
import { Github, GitBranch, Settings, Database, Folder, ExternalLink, Loader2, Server, Shield, CheckCircle2, Plus } from 'lucide-react';

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
      case 'devops-user':
        return <Server className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'bitbucket':
        return <GitBranch className="w-4 h-4" />;
      case 'custom':
        return <Plus className="w-4 h-4" />;
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
        'security':ـد'مستخدم الأمان',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure',
        'custom': 'مزود مخصص'
      },
      'en': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'devops-user': 'DevOps User',
        'security': 'Security User',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure',
        'custom': 'Custom Provider'
      }
    };
    return names[language][source as keyof typeof names[typeof language]] || source;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {language === 'ar' ? 'جاري تحميل المستودعات...' : 'Loading repositories...'}
          </p>
        </div>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h4 className="text-lg font-medium mb-2">
          {language === 'ar' 
            ? 'لا توجد مستودعات متاحة' 
            : 'No repositories available'
          }
        </h4>
        <p className="text-sm">
          {language === 'ar' 
            ? 'تأكد من ربط حسابك وتحديد المشاريع في إعدادات التكامل' 
            : 'Make sure to connect your account and select projects in integration settings'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {repositories.map((repo) => (
        <div key={repo.source} className="space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            {getSourceIcon(repo.source)}
            <h4 className="text-sm font-semibold text-gray-800">{getSourceName(repo.source)}</h4>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {repo.projects.length} {language === 'ar' ? 'مشروع' : 'projects'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {repo.projects.map((project) => {
              const isSelected = selectedRepository?.project.id === project.id && selectedRepository?.source === repo.source;
              
              return (
                <Card 
                  key={project.id} 
                  className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectRepository(repo.source, project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-blue-800' : 'text-gray-900'}`}>
                          {project.name}
                        </span>
                        {project.status && (
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                        )}
                      </div>
                      {project.key && (
                        <p className="text-xs text-gray-500 mb-1">
                          {language === 'ar' ? 'المفتاح:' : 'Key:'} {project.key}
                        </p>
                      )}
                      {project.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RepositoryList;
