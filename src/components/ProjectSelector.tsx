
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IntegrationType, Project } from '@/types/integrations';
import { IntegrationService } from '@/services/integrationService';
import { Loader2, Folder, GitBranch, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectSelectorProps {
  integrationType: IntegrationType;
  settings: any;
  selectedProjects: string[];
  onProjectsChange: (projectIds: string[]) => void;
  language: 'ar' | 'en';
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  integrationType,
  settings,
  selectedProjects,
  onProjectsChange,
  language
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!settings?.apiKey) {
      return;
    }

    setIsLoading(true);
    try {
      const integrationService = new IntegrationService({ [integrationType]: settings });
      const availableProjects = await integrationService.fetchAvailableProjects(integrationType);
      setProjects(availableProjects);
    } catch (error) {
      console.error(`Error fetching ${integrationType} projects:`, error);
      toast({
        title: language === 'ar' ? 'خطأ في جلب المشاريع' : 'Error Fetching Projects',
        description: language === 'ar' ? 'تعذر جلب قائمة المشاريع' : 'Could not fetch projects list',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (settings?.enabled && settings?.apiKey) {
      fetchProjects();
    }
  }, [settings?.enabled, settings?.apiKey]);

  const handleProjectToggle = (projectId: string) => {
    const updatedSelection = selectedProjects.includes(projectId)
      ? selectedProjects.filter(id => id !== projectId)
      : [...selectedProjects, projectId];
    
    onProjectsChange(updatedSelection);
  };

  const getIcon = () => {
    switch (integrationType) {
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

  const getEmptyStateText = () => {
    if (language === 'ar') {
      switch (integrationType) {
        case 'devops':
          return 'لا توجد مشاريع Azure DevOps متاحة';
        case 'bitbucket':
          return 'لا توجد مستودعات Bitbucket متاحة';
        case 'jira':
          return 'لا توجد مشاريع Jira متاحة';
        case 'clickup':
          return 'لا توجد مساحات ClickUp متاحة';
        default:
          return 'لا توجد مشاريع متاحة';
      }
    } else {
      return `No ${integrationType} projects available`;
    }
  };

  if (!settings?.enabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center space-x-2">
          {getIcon()}
          <span>
            {language === 'ar' ? 'اختر المشاريع المسجلة' : 'Select Registered Projects'}
          </span>
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjects}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            language === 'ar' ? 'تحديث' : 'Refresh'
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{getEmptyStateText()}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {projects.map((project) => (
            <Card key={project.id} className="p-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={`project-${project.id}`}
                  checked={selectedProjects.includes(project.id)}
                  onCheckedChange={() => handleProjectToggle(project.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {project.name}
                    </label>
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
                  {project.lastActivity && (
                    <p className="text-xs text-gray-400 mt-1">
                      {language === 'ar' ? 'آخر نشاط:' : 'Last activity:'} {project.lastActivity}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedProjects.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">
            {language === 'ar' 
              ? `تم اختيار ${selectedProjects.length} من ${projects.length} مشروع`
              : `${selectedProjects.length} of ${projects.length} projects selected`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
