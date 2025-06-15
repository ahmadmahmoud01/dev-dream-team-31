
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Language } from '@/types/chat';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationService } from '@/services/integrationService';
import { Project } from '@/types/integrations';
import { GitBranch, Database, Folder, Search, ExternalLink, Loader2 } from 'lucide-react';

interface QuickRepositoryAccessProps {
  language: Language;
  isOpen: boolean;
  onToggle: () => void;
}

const QuickRepositoryAccess: React.FC<QuickRepositoryAccessProps> = ({
  language,
  isOpen,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repositories, setRepositories] = useState<{ source: string; projects: Project[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useIntegrations();

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const integrationService = new IntegrationService(settings);
      const repoData = [];

      // Fetch from all enabled integrations
      for (const [source, config] of Object.entries(settings)) {
        if (config.enabled && config.selectedProjects && config.selectedProjects.length > 0) {
          try {
            const projects = await integrationService.fetchAvailableProjects(source as any);
            const selectedProjects = projects.filter(p => config.selectedProjects!.includes(p.id));
            if (selectedProjects.length > 0) {
              repoData.push({ source, projects: selectedProjects });
            }
          } catch (error) {
            console.error(`Error fetching ${source} projects:`, error);
          }
        }
      }

      setRepositories(repoData);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRepositories();
    }
  }, [isOpen, settings]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'devops':
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
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      },
      'en': {
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      }
    };
    return names[language][source as keyof typeof names[typeof language]] || source;
  };

  const filteredRepositories = repositories.map(repo => ({
    ...repo,
    projects: repo.projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.key && project.key.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(repo => repo.projects.length > 0);

  return (
    <Popover open={isOpen} onOpenChange={onToggle}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="w-4 h-4 mr-1" />
          {language === 'ar' ? 'المستودعات' : 'Repositories'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'الوصول السريع للمستودعات' : 'Quick Repository Access'}
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchRepositories} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={language === 'ar' ? 'البحث في المستودعات...' : 'Search repositories...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {language === 'ar' 
                  ? 'لا توجد مستودعات متاحة' 
                  : 'No repositories available'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRepositories.map((repo) => (
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
                      <Card key={project.id} className="p-3 hover:bg-gray-50 cursor-pointer">
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
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default QuickRepositoryAccess;
