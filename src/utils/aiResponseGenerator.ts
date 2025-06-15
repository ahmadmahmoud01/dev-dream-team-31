
import { Language, AIRole } from '@/types/chat';
import { AIService } from '@/services/aiService';
import { getFallbackResponse } from './fallbackResponses';

export const generateRoleBasedResponse = async (
  input: string, 
  role: AIRole, 
  language: Language, 
  aiSettings?: any
): Promise<string> => {
  // إذا كانت إعدادات الذكاء الاصطناعي متوفرة ومكونة بشكل صحيح
  if (aiSettings && aiSettings.isConfigured()) {
    try {
      const aiService = new AIService(aiSettings.settings);
      return await aiService.generateResponse(input, role, language);
    } catch (error) {
      console.error('AI Service Error:', error);
      // العودة للاستجابة التقليدية في حالة الخطأ
    }
  }
  
  // استخدام الاستجابة التقليدية كـ fallback
  return getFallbackResponse(input, role, language);
};
