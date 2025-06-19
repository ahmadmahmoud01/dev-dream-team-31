import { useState, useEffect } from 'react';
import { IntegrationSettings, IntegrationType } from '@/types/integrations';

const DEFAULT_SETTINGS: IntegrationSettings = {
  axure: { enabled: false },
  jira: { enabled: false },
  clickup: { enabled: false },
  devops: { 
    enabled: false,
    personalAccessToken: '',
    organizationUrl: '',
    projectName: '',
    teamMembers: []
  },
  bitbucket: { enabled: false }
};

export const useIntegrations = () => {
  const [settings, setSettings] = useState<IntegrationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('integration-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading integration settings:', error);
      }
    }
  }, []);

  // Save to localStorage helper
  const saveToLocalStorage = (newSettings: IntegrationSettings) => {
    try {
      localStorage.setItem('integration-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving integration settings:', error);
    }
  };

  // Azure DevOps specific toggle function
  const toggleAzureDevOps = () => {
    const currentDevOpsSettings = settings.devops;
    const updatedSettings = {
      ...settings,
      devops: {
        ...currentDevOpsSettings,
        enabled: !currentDevOpsSettings?.enabled
      }
    };
    setSettings(updatedSettings);
    saveToLocalStorage(updatedSettings);
    
    // Log the action for debugging
    console.log(`Azure DevOps integration ${!currentDevOpsSettings?.enabled ? 'enabled' : 'disabled'}`);
  };

  // Enable Azure DevOps specifically
  const enableAzureDevOps = () => {
    if (!settings.devops?.enabled) {
      const updatedSettings = {
        ...settings,
        devops: {
          ...settings.devops,
          enabled: true
        }
      };
      setSettings(updatedSettings);
      saveToLocalStorage(updatedSettings);
      console.log('Azure DevOps integration enabled');
    }
  };

  // Disable Azure DevOps specifically
  const disableAzureDevOps = () => {
    if (settings.devops?.enabled) {
      const updatedSettings = {
        ...settings,
        devops: {
          ...settings.devops,
          enabled: false
        }
      };
      setSettings(updatedSettings);
      saveToLocalStorage(updatedSettings);
      console.log('Azure DevOps integration disabled');
    }
  };

  // Check if Azure DevOps is enabled
  const isAzureDevOpsEnabled = (): boolean => {
    return settings.devops?.enabled || false;
  };

  // Check if Azure DevOps has valid configuration
  const hasValidAzureDevOpsConfig = (): boolean => {
    const devopsConfig = settings.devops;
    return !!(
      devopsConfig?.personalAccessToken && 
      devopsConfig?.organizationUrl && 
      devopsConfig?.projectName
    );
  };

  // Get Azure DevOps status
  const getAzureDevOpsStatus = () => {
    const enabled = isAzureDevOpsEnabled();
    const configured = hasValidAzureDevOpsConfig();
    
    return {
      enabled,
      configured,
      status: enabled ? (configured ? 'active' : 'needs-setup') : 'disabled',
      teamMembersCount: settings.devops?.teamMembers?.length || 0
    };
  };

  // Generic functions (keeping for backward compatibility)
  const saveIntegrationSettings = (integrationType: IntegrationType, newSettings: Partial<IntegrationSettings[string]>) => {
    const updatedSettings = {
      ...settings,
      [integrationType]: {
        ...settings[integrationType],
        ...newSettings
      }
    };
    setSettings(updatedSettings);
    saveToLocalStorage(updatedSettings);
  };

  const testConnection = async (integrationType: IntegrationType) => {
    setIsLoading(true);
    try {
      // Special handling for Azure DevOps
      if (integrationType === 'devops') {
        const devopsConfig = settings.devops;
        if (!devopsConfig?.enabled) {
          console.warn('Azure DevOps integration is not enabled');
          return false;
        }
        
        if (!hasValidAzureDevOpsConfig()) {
          console.warn('Azure DevOps: Missing required configuration');
          return false;
        }
        
        // Simulate Azure DevOps connection test
        await new Promise(resolve => setTimeout(resolve, 2000));
        return Math.random() > 0.2; // 80% success rate
      }
      
      // Generic connection test for other integrations
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random() > 0.2;
    } catch (error) {
      console.error(`Connection test failed for ${integrationType}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isIntegrationEnabled = (integrationType: IntegrationType) => {
    return settings[integrationType]?.enabled || false;
  };

  const getSelectedProjects = (integrationType: IntegrationType) => {
    return settings[integrationType]?.selectedProjects || [];
  };

  const updateSelectedProjects = (integrationType: IntegrationType, projectIds: string[]) => {
    saveIntegrationSettings(integrationType, {
      ...settings[integrationType],
      selectedProjects: projectIds
    });
  };

  return {
    // State
    settings,
    isLoading,

    // Azure DevOps specific functions
    toggleAzureDevOps,
    enableAzureDevOps,
    disableAzureDevOps,
    isAzureDevOpsEnabled,
    hasValidAzureDevOpsConfig,
    getAzureDevOpsStatus,

    // Generic functions (for backward compatibility)
    saveIntegrationSettings,
    testConnection,
    isIntegrationEnabled,
    getSelectedProjects,
    updateSelectedProjects
  };
};
