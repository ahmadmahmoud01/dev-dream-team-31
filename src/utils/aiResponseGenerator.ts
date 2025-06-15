
import { Language, AIRole } from '@/types/chat';
import { AIService } from '@/services/aiService';
import { IntegrationService } from '@/services/integrationService';
import { getFallbackResponse } from './fallbackResponses';

export const generateRoleBasedResponse = async (
  input: string, 
  role: AIRole, 
  language: Language, 
  aiSettings?: any,
  integrationSettings?: any
): Promise<string> => {
  let integrationContext = '';
  
  // جلب بيانات التكاملات إذا كانت متوفرة
  if (integrationSettings) {
    try {
      const integrationService = new IntegrationService(integrationSettings);
      const integrationsData = await integrationService.fetchAllIntegrationsData();
      
      if (integrationsData.length > 0) {
        integrationContext = formatIntegrationContext(integrationsData, language);
        console.log('Integration context added to AI prompt');
      }
    } catch (error) {
      console.error('Error fetching integration data:', error);
    }
  }

  // إذا كانت إعدادات الذكاء الاصطناعي متوفرة ومكونة بشكل صحيح
  if (aiSettings && aiSettings.isConfigured()) {
    try {
      const aiService = new AIService(aiSettings.settings);
      return await aiService.generateResponse(input, role, language, integrationContext);
    } catch (error) {
      console.error('AI Service Error:', error);
      // العودة للاستجابة التقليدية في حالة الخطأ
    }
  }
  
  // استخدام الاستجابة التقليدية كـ fallback مع السياق
  return getFallbackResponseWithIntegrations(input, role, language, integrationContext);
};

const formatIntegrationContext = (integrationsData: any[], language: Language): string => {
  let context = language === 'ar' 
    ? '\n--- بيانات التكاملات المتاحة ---\n'
    : '\n--- Available Integration Data ---\n';

  integrationsData.forEach(integration => {
    const sourceName = getSourceDisplayName(integration.source, language);
    
    if (integration.data.length > 0) {
      context += `\n${sourceName}:\n`;
      
      integration.data.forEach(item => {
        context += `- ${formatDataItem(item, integration.source, language)}\n`;
      });
    }
  });

  return context;
};

const getSourceDisplayName = (source: string, language: Language): string => {
  const names = {
    'ar': {
      'jira': 'مهام Jira',
      'clickup': 'مهام ClickUp', 
      'axure': 'مشاريع Axure',
      'devops': 'عناصر Azure DevOps',
      'bitbucket': 'مستودعات Bitbucket'
    },
    'en': {
      'jira': 'Jira Issues',
      'clickup': 'ClickUp Tasks',
      'axure': 'Axure Projects', 
      'devops': 'Azure DevOps Items',
      'bitbucket': 'Bitbucket Repositories'
    }
  };
  
  return names[language][source as keyof typeof names[typeof language]] || source;
};

const formatDataItem = (item: any, source: string, language: Language): string => {
  switch (source) {
    case 'jira':
      return language === 'ar' 
        ? `[${item.key}] ${item.summary} - المشروع: ${item.project} - الحالة: ${item.status} - المسؤول: ${item.assignee} - Sprint: ${item.sprint}`
        : `[${item.key}] ${item.summary} - Project: ${item.project} - Status: ${item.status} - Assignee: ${item.assignee} - Sprint: ${item.sprint}`;
    
    case 'clickup':
      return language === 'ar'
        ? `${item.name} - ${item.space} - الحالة: ${item.status} - المسؤول: ${item.assignees?.join(', ')} - الوقت المستغرق: ${item.timeTracked}`
        : `${item.name} - ${item.space} - Status: ${item.status} - Assignees: ${item.assignees?.join(', ')} - Time: ${item.timeTracked}`;
    
    case 'axure':
      return language === 'ar'
        ? `${item.name} - الحالة: ${item.status} - الصفحات: ${item.pages} - الإصدار: ${item.version} - المتعاونون: ${item.collaborators?.join(', ')}`
        : `${item.name} - Status: ${item.status} - Pages: ${item.pages} - Version: ${item.version} - Collaborators: ${item.collaborators?.join(', ')}`;
    
    case 'devops':
      return language === 'ar'
        ? `[${item.id}] ${item.title} - ${item.project} - النوع: ${item.workItemType} - الحالة: ${item.state} - المسؤول: ${item.assignedTo}`
        : `[${item.id}] ${item.title} - ${item.project} - Type: ${item.workItemType} - State: ${item.state} - Assigned: ${item.assignedTo}`;
    
    case 'bitbucket':
      return language === 'ar'
        ? `[${item.type}] ${item.title || item.message} - ${item.repository} - المؤلف: ${item.author} - الحالة: ${item.status || 'مُلتزم'}`
        : `[${item.type}] ${item.title || item.message} - ${item.repository} - Author: ${item.author} - Status: ${item.status || 'Committed'}`;
    
    default:
      return JSON.stringify(item);
  }
};

const getFallbackResponseWithIntegrations = (input: string, role: AIRole, language: Language, integrationContext: string): string => {
  const baseResponse = getFallbackResponse(input, role, language);
  
  if (integrationContext) {
    const contextNote = language === 'ar'
      ? '\n\nبناءً على بيانات التكاملات المختارة:'
      : '\n\nBased on selected integration data:';
    
    return baseResponse + contextNote + integrationContext;
  }
  
  return baseResponse;
};
