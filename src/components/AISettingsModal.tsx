
import React, { useState } from 'react';
import { Settings, Bot, Key, Thermometer, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAISettings } from '@/hooks/useAISettings';
import { AI_PROVIDERS } from '@/config/aiProviders';
import { Language } from '@/types/chat';

interface AISettingsModalProps {
  language: Language;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ language }) => {
  const { settings, saveSettings, getCurrentProvider, getCurrentModel, isConfigured } = useAISettings();
  const [isOpen, setIsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.apiKey);

  const currentProvider = getCurrentProvider();
  const currentModel = getCurrentModel();

  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      saveSettings({
        selectedProvider: providerId,
        selectedModel: provider.models[0].id
      });
    }
  };

  const handleSaveApiKey = () => {
    saveSettings({ apiKey: tempApiKey });
    setIsOpen(false);
  };

  const isRTL = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${!isConfigured() ? 'text-orange-600 animate-pulse' : ''}`}
        >
          <Bot className="w-4 h-4" />
          {language === 'ar' ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
          {!isConfigured() && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
        </Button>
      </DialogTrigger>
      
      <DialogContent className={`max-w-2xl ${isRTL ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {language === 'ar' ? 'إعدادات نماذج الذكاء الاصطناعي' : 'AI Model Settings'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'مقدم الخدمة' : 'AI Provider'}</Label>
            <Select value={settings.selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.icon}</span>
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          {currentProvider && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'النموذج' : 'Model'}</Label>
              <Select value={settings.selectedModel} onValueChange={(value) => saveSettings({ selectedModel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider.models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="space-y-1">
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-gray-500">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentModel && (
                <Card className="p-3 bg-gray-50">
                  <div className="text-sm space-y-1">
                    <div><strong>{language === 'ar' ? 'الحد الأقصى للرموز:' : 'Max Tokens:'}</strong> {currentModel.maxTokens.toLocaleString()}</div>
                    <div><strong>{language === 'ar' ? 'التكلفة لكل 1000 رمز:' : 'Cost per 1K tokens:'}</strong> ${currentModel.costPer1kTokens}</div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* API Key */}
          {currentProvider?.requiresApiKey && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {language === 'ar' ? 'مفتاح API' : 'API Key'}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل مفتاح API...' : 'Enter API key...'}
                />
                <Button onClick={handleSaveApiKey} variant="outline">
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
              {!settings.apiKey && (
                <div className="text-xs text-orange-600">
                  {language === 'ar' ? 'مطلوب مفتاح API لاستخدام هذا المقدم' : 'API key required to use this provider'}
                </div>
              )}
            </div>
          )}

          {/* Temperature Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              {language === 'ar' ? `درجة الحرارة: ${settings.temperature}` : `Temperature: ${settings.temperature}`}
            </Label>
            <Slider
              value={[settings.temperature]}
              onValueChange={([value]) => saveSettings({ temperature: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <div className="text-xs text-gray-500">
              {language === 'ar' ? 'قيم أقل = إجابات أكثر تحفظاً، قيم أعلى = إجابات أكثر إبداعاً' : 'Lower = more conservative, Higher = more creative'}
            </div>
          </div>

          {/* Max Tokens Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              {language === 'ar' ? `الحد الأقصى للرموز: ${settings.maxTokens}` : `Max Tokens: ${settings.maxTokens}`}
            </Label>
            <Slider
              value={[settings.maxTokens]}
              onValueChange={([value]) => saveSettings({ maxTokens: value })}
              min={256}
              max={currentModel?.maxTokens || 4096}
              step={256}
              className="w-full"
            />
          </div>

          {/* Status */}
          <Card className={`p-3 ${isConfigured() ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured() ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-sm font-medium">
                {isConfigured() 
                  ? (language === 'ar' ? 'جاهز للاستخدام' : 'Ready to use')
                  : (language === 'ar' ? 'يتطلب إعداد' : 'Configuration required')
                }
              </span>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsModal;
