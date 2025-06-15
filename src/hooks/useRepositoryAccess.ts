
import { useState, useEffect } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationService } from '@/services/integrationService';
import { Project } from '@/types/integrations';

type ConnectionType = 'github' | 'bitbucket' | 'devops';

export const useRepositoryAccess = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repositories, setRepositories] = useState<{ source: string; projects: Project[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<{ source: string; project: Project } | null>(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType | null>(null);
  const [showConnectionSelection, setShowConnectionSelection] = useState(true);
  const { settings } = useIntegrations();

  const fetchRepositories = async () => {
    if (!selectedConnectionType) return;
    
    setIsLoading(true);
    try {
      const integrationService = new IntegrationService(settings);
      const repoData = [];

      // Map connection type to integration source
      const sourceMapping = {
        'github': 'bitbucket', // Using bitbucket as placeholder for GitHub
        'bitbucket': 'bitbucket',
        'devops': 'devops'
      };

      const source = sourceMapping[selectedConnectionType];
      const config = settings[source];

      if (config?.enabled && config.selectedProjects && config.selectedProjects.length > 0) {
        try {
          const projects = await integrationService.fetchAvailableProjects(source as any);
          const selectedProjects = projects.filter(p => config.selectedProjects!.includes(p.id));
          if (selectedProjects.length > 0) {
            repoData.push({ source: selectedConnectionType, projects: selectedProjects });
          }
        } catch (error) {
          console.error(`Error fetching ${selectedConnectionType} projects:`, error);
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
    if (selectedConnectionType) {
      fetchRepositories();
    }
  }, [selectedConnectionType, settings]);

  const handleSelectRepository = (source: string, project: Project) => {
    setSelectedRepository({ source, project });
    console.log('Selected repository:', { source, project });
  };

  const handleConnectionTypeSelect = (type: ConnectionType) => {
    setSelectedConnectionType(type);
    setShowConnectionSelection(false);
    setSelectedRepository(null);
    setRepositories([]);
  };

  const handleBackToConnectionSelection = () => {
    setShowConnectionSelection(true);
    setSelectedConnectionType(null);
    setSelectedRepository(null);
    setRepositories([]);
  };

  const filteredRepositories = repositories.map(repo => ({
    ...repo,
    projects: repo.projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.key && project.key.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(repo => repo.projects.length > 0);

  return {
    searchTerm,
    setSearchTerm,
    repositories: filteredRepositories,
    isLoading,
    selectedRepository,
    selectedConnectionType,
    showConnectionSelection,
    handleSelectRepository,
    handleConnectionTypeSelect,
    handleBackToConnectionSelection,
    fetchRepositories
  };
};
