import { useState, useEffect } from 'react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationService } from '@/services/integrationService';
import { Project } from '@/types/integrations';
import { CustomProviderConfig } from '@/components/CustomProviderConfig';

type ConnectionType = 'github' | 'bitbucket' | 'devops' | 'devops-user' | 'security' | 'custom';

export const useRepositoryAccess = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repositories, setRepositories] = useState<{ source: string; projects: Project[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<{ source: string; project: Project } | null>(null);
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType>('devops');
  const [showConnectionSelection, setShowConnectionSelection] = useState(false);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>([]);
  const { settings } = useIntegrations();

  // Load custom providers from localStorage
  useEffect(() => {
    const savedProviders = localStorage.getItem('custom-providers');
    if (savedProviders) {
      try {
        setCustomProviders(JSON.parse(savedProviders));
      } catch (error) {
        console.error('Error loading custom providers:', error);
      }
    }
  }, []);

  const saveCustomProvider = (config: CustomProviderConfig) => {
    const updatedProviders = [...customProviders, { ...config, id: Date.now().toString() }];
    setCustomProviders(updatedProviders);
    localStorage.setItem('custom-providers', JSON.stringify(updatedProviders));
    setShowCustomConfig(false);
    setShowConnectionSelection(false);
  };

  const fetchRepositories = async () => {
    if (!selectedConnectionType) return;
    
    setIsLoading(true);
    try {
      const integrationService = new IntegrationService(settings);
      const repoData = [];

      if (selectedConnectionType === 'custom') {
        // For custom providers, we'll simulate fetching from the configured provider
        if (customProviders.length > 0) {
          const customProvider = customProviders[0]; // Use first custom provider for now
          try {
            const projects = await fetchCustomProviderProjects(customProvider);
            if (projects.length > 0) {
              repoData.push({ source: 'custom', projects });
            }
          } catch (error) {
            console.error('Error fetching custom provider projects:', error);
          }
        }
      } else {
        // ... keep existing code for other connection types
        const sourceMapping = {
          'github': 'bitbucket',
          'bitbucket': 'bitbucket',
          'devops': 'devops',
          'devops-user': 'devops',
          'security': 'devops'
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
      }

      setRepositories(repoData);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomProviderProjects = async (provider: CustomProviderConfig): Promise<Project[]> => {
    // محاكاة جلب المشاريع من مزود مخصص
    console.log(`Fetching projects from custom provider: ${provider.name}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    return [
      {
        id: 'custom-proj-1',
        name: `${provider.name} - المشروع الأول`,
        key: 'CUSTOM-1',
        description: `مشروع من ${provider.name}`,
        status: 'Active',
        lastActivity: new Date().toISOString().split('T')[0]
      },
      {
        id: 'custom-proj-2',
        name: `${provider.name} - التطبيق الرئيسي`,
        key: 'CUSTOM-2',
        description: `التطبيق الرئيسي من ${provider.name}`,
        status: 'Active',
        lastActivity: new Date().toISOString().split('T')[0]
      }
    ];
  };

  useEffect(() => {
    if (selectedConnectionType && selectedConnectionType !== 'custom') {
      fetchRepositories();
    } else if (selectedConnectionType === 'custom' && customProviders.length > 0) {
      fetchRepositories();
    }
  }, [selectedConnectionType, settings, customProviders]);

  const handleSelectRepository = (source: string, project: Project) => {
    setSelectedRepository({ source, project });
    console.log('Selected repository:', { source, project });
  };

  const handleConnectionTypeSelect = (type: ConnectionType) => {
    if (type === 'custom') {
      if (customProviders.length === 0) {
        setShowCustomConfig(true);
        return;
      }
    }
    setSelectedConnectionType(type);
    setShowConnectionSelection(false);
    setSelectedRepository(null);
    setRepositories([]);
  };

  const handleShowConnectionSelection = () => {
    setShowConnectionSelection(true);
    setShowCustomConfig(false);
  };

  const handleBackToConnectionSelection = () => {
    setShowConnectionSelection(true);
    setShowCustomConfig(false);
    setSelectedRepository(null);
    setRepositories([]);
  };

  const handleBackFromCustomConfig = () => {
    setShowCustomConfig(false);
    setShowConnectionSelection(true);
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
    showCustomConfig,
    customProviders,
    handleSelectRepository,
    handleConnectionTypeSelect,
    handleShowConnectionSelection,
    handleBackToConnectionSelection,
    handleBackFromCustomConfig,
    saveCustomProvider,
    fetchRepositories
  };
};
