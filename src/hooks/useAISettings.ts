
import { useState, useEffect } from 'react';
import { AISettings } from '@/types/ai';
import { AI_PROVIDERS } from '@/config/aiProviders';

const DEFAULT_SETTINGS: AISettings = {
  selectedProvider: 'local',
  selectedModel: 'simulation',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2048
};

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading AI settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<AISettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('ai-settings', JSON.stringify(updatedSettings));
  };

  const getCurrentProvider = () => {
    return AI_PROVIDERS.find(p => p.id === settings.selectedProvider);
  };

  const getCurrentModel = () => {
    const provider = getCurrentProvider();
    return provider?.models.find(m => m.id === settings.selectedModel);
  };

  const isConfigured = () => {
    const provider = getCurrentProvider();
    if (!provider) return false;
    if (provider.requiresApiKey && !settings.apiKey.trim()) return false;
    return true;
  };

  return {
    settings,
    saveSettings,
    getCurrentProvider,
    getCurrentModel,
    isConfigured,
    isLoading,
    setIsLoading
  };
};
