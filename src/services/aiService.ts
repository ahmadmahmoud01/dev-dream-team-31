
import { AISettings } from '@/types/ai';
import { getProviderById, getModelById } from '@/config/aiProviders';

export class AIService {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async generateResponse(message: string, role: string, language: 'ar' | 'en', integrationContext?: string): Promise<string> {
    const provider = getProviderById(this.settings.selectedProvider);
    const model = getModelById(this.settings.selectedModel);

    if (!provider || !model) {
      throw new Error('Invalid provider or model configuration');
    }

    // Handle local simulation
    if (provider.id === 'local') {
      return this.simulateResponse(message, role, language, integrationContext);
    }

    // Handle real API calls
    if (provider.requiresApiKey && !this.settings.apiKey) {
      throw new Error('API key is required for this provider');
    }

    try {
      if (provider.id === 'openai') {
        return await this.callOpenAI(message, role, language, integrationContext);
      } else if (provider.id === 'anthropic') {
        return await this.callAnthropic(message, role, language, integrationContext);
      }
    } catch (error) {
      console.error('AI API Error:', error);
      throw new Error('Failed to generate response from AI service');
    }

    throw new Error('Unsupported provider');
  }

  private async callOpenAI(message: string, role: string, language: 'ar' | 'en', integrationContext?: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt(role, language, integrationContext);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.settings.selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'لم أتمكن من توليد إجابة';
  }

  private async callAnthropic(message: string, role: string, language: 'ar' | 'en', integrationContext?: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt(role, language, integrationContext);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.settings.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.settings.selectedModel,
        max_tokens: this.settings.maxTokens,
        temperature: this.settings.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'لم أتمكن من توليد إجابة';
  }

  private simulateResponse(message: string, role: string, language: 'ar' | 'en', integrationContext?: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let response = language === 'ar' 
          ? `هذه استجابة محاكاة من ${role} للرسالة: ${message.substring(0, 50)}...`
          : `This is a simulated response from ${role} for the message: ${message.substring(0, 50)}...`;
        
        if (integrationContext) {
          const contextNote = language === 'ar'
            ? '\n\nتم تضمين بيانات التكاملات في الاستجابة.'
            : '\n\nIntegration data has been included in the response.';
          response += contextNote;
        }
        
        resolve(response);
      }, 1000 + Math.random() * 2000);
    });
  }

  private getSystemPrompt(role: string, language: 'ar' | 'en', integrationContext?: string): string {
    const rolePrompts = {
      'ar': {
        'tester': 'أنت مختبر برمجيات خبير. ساعد المستخدم في اختبار البرمجيات وضمان الجودة.',
        'frontend': 'أنت مطور واجهات مستخدم خبير. ساعد المستخدم في تطوير واجهات المستخدم.',
        'backend': 'أنت مطور خادم خبير. ساعد المستخدم في تطوير الخوادم وقواعد البيانات.',
        'business-analyst': 'أنت محلل أعمال خبير. ساعد المستخدم في تحليل متطلبات الأعمال.',
        'mobile': 'أنت مطور تطبيقات محمولة خبير. ساعد المستخدم في تطوير التطبيقات المحمولة.',
        'devops': 'أنت مهندس DevOps خبير. ساعد المستخدم في النشر وإدارة البنية التحتية.',
        'fullstack': 'أنت مطور ويب متكامل خبير. ساعد المستخدم في التطوير الشامل.',
        'project-manager': 'أنت مدير مشروع خبير. ساعد المستخدم في إدارة المشاريع.',
        'generate-srs': 'أنت مدير مشروع خبير. ساعد المستخدم في إدارة المشاريع.',
        'cost-accountant': 'أنت محاسب تكاليف خبير. ساعد المستخدم في تحليل التكاليف والميزانيات.'
      },
      'en': {
        'tester': 'You are an expert software tester. Help the user with software testing and quality assurance.',
        'frontend': 'You are an expert frontend developer. Help the user with user interface development.',
        'backend': 'You are an expert backend developer. Help the user with server-side development and databases.',
        'business-analyst': 'You are an expert business analyst. Help the user with business requirements analysis.',
        'mobile': 'You are an expert mobile app developer. Help the user with mobile application development.',
        'devops': 'You are an expert DevOps engineer. Help the user with deployment and infrastructure management.',
        'fullstack': 'You are an expert full-stack web developer. Help the user with comprehensive development.',
        'project-manager': 'You are an expert project manager. Help the user with project management.',
        'generate-srs': 'You are a SRS generator. Help the user with generating system requirements specifications.',
        'cost-accountant': 'You are an expert cost accountant. Help the user with cost analysis and budgeting.'
      }
    };

    let systemPrompt = rolePrompts[language][role as keyof typeof rolePrompts[typeof language]] || 
           (language === 'ar' ? 'أنت مساعد ذكي مفيد.' : 'You are a helpful AI assistant.');
    
    if (integrationContext) {
      const contextInstruction = language === 'ar'
        ? '\n\nلديك إمكانية الوصول إلى بيانات التكاملات التالية. استخدمها للإجابة على الأسئلة المتعلقة بالمشاريع والمهام:'
        : '\n\nYou have access to the following integration data. Use it to answer questions about projects and tasks:';
      
      systemPrompt += contextInstruction + integrationContext;
    }

    return systemPrompt;
  }
}
