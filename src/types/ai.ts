
export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  models: AIModel[];
  requiresApiKey: boolean;
  apiEndpoint: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPer1kTokens: number;
  description: string;
}

export interface AISettings {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}
