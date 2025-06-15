
import { AIProvider } from '@/types/ai';

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    requiresApiKey: true,
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    models: [
      {
        id: 'gpt-4.1-2025-04-14',
        name: 'GPT-4.1 (Flagship)',
        provider: 'openai',
        maxTokens: 8192,
        costPer1kTokens: 0.03,
        description: 'أحدث وأقوى نموذج من OpenAI'
      },
      {
        id: 'gpt-4.1-mini-2025-04-14',
        name: 'GPT-4.1 Mini',
        provider: 'openai',
        maxTokens: 4096,
        costPer1kTokens: 0.015,
        description: 'نسخة أسرع وأرخص من GPT-4.1'
      },
      {
        id: 'o4-mini-2025-04-16',
        name: 'O4 Mini (Reasoning)',
        provider: 'openai',
        maxTokens: 4096,
        costPer1kTokens: 0.02,
        description: 'نموذج محسن للتفكير والاستنتاج'
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '🧠',
    requiresApiKey: true,
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        maxTokens: 8192,
        costPer1kTokens: 0.025,
        description: 'نموذج عالي الأداء مع كفاءة استثنائية'
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        provider: 'anthropic',
        maxTokens: 8192,
        costPer1kTokens: 0.04,
        description: 'النموذج الأكثر قدرة وذكاءً'
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        maxTokens: 4096,
        costPer1kTokens: 0.01,
        description: 'النموذج الأسرع للاستجابات السريعة'
      }
    ]
  },
  {
    id: 'local',
    name: 'نموذج محلي',
    icon: '💻',
    requiresApiKey: false,
    apiEndpoint: '',
    models: [
      {
        id: 'simulation',
        name: 'محاكاة الذكاء الاصطناعي',
        provider: 'local',
        maxTokens: 2048,
        costPer1kTokens: 0,
        description: 'محاكاة للاختبار (لا يتطلب API)'
      }
    ]
  }
];

export const getProviderById = (id: string) => {
  return AI_PROVIDERS.find(provider => provider.id === id);
};

export const getModelById = (modelId: string) => {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) return model;
  }
  return null;
};
