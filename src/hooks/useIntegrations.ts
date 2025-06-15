
import { useState, useEffect } from 'react';
import { IntegrationSettings, IntegrationType } from '@/types/integrations';

const DEFAULT_SETTINGS: IntegrationSettings = {
  axure: { enabled: false },
  jira: { enabled: false },
  clickup: { enabled: false },
  devops: { enabled: false },
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

  const saveIntegrationSettings = (integrationType: IntegrationType, newSettings: Partial<IntegrationSettings[string]>) => {
    const updatedSettings = {
      ...settings,
      [integrationType]: {
        ...settings[integrationType],
        ...newSettings
      }
    };
    setSettings(updatedSettings);
    localStorage.setItem('integration-settings', JSON.stringify(updatedSettings));
  };

  const testConnection = async (integrationType: IntegrationType) => {
    setIsLoading(true);
    try {
      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random() > 0.2; // نجاح بنسبة 80٪
    } catch (error) {
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
    settings,
    saveIntegrationSettings,
    testConnection,
    isIntegrationEnabled,
    getSelectedProjects,
    updateSelectedProjects,
    isLoading
  };
};
