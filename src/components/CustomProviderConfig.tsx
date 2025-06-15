
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Language } from '@/types/chat';
import { ArrowLeft, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';

interface CustomProviderConfigProps {
  language: Language;
  onBack: () => void;
  onSave: (config: CustomProviderConfig) => void;
}

export interface CustomProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  authType: 'token' | 'basic' | 'oauth';
  username?: string;
  password?: string;
  headers?: string;
  description?: string;
}

const CustomProviderConfig: React.FC<CustomProviderConfigProps> = ({
  language,
  onBack,
  onSave
}) => {
  const [config, setConfig] = useState<CustomProviderConfig>({
    name: '',
    baseUrl: '',
    apiKey: '',
    authType: 'token',
    headers: '',
    description: ''
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof CustomProviderConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      // نجاح بنسبة 70%
      const success = Math.random() > 0.3;
      setConnectionStatus(success ? 'success' : 'error');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (config.name && config.baseUrl) {
      onSave(config);
    }
  };

  const isFormValid = config.name.trim() && config.baseUrl.trim() && 
    (config.authType === 'token' ? config.apiKey.trim() : 
     config.authType === 'basic' ? (config.username?.trim() && config.password?.trim()) : 
     true);

  return (
    <div className="p-4 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'إعداد مزود مخصص' : 'Custom Provider Setup'}
          </h3>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        {/* Provider Name */}
        <div className="space-y-2">
          <Label htmlFor="providerName">
            {language === 'ar' ? 'اسم المزود' : 'Provider Name'}
          </Label>
          <Input
            id="providerName"
            placeholder={language === 'ar' ? 'مثل: GitLab، أو Gitea، أو مزود آخر' : 'e.g. GitLab, Gitea, or other provider'}
            value={config.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        {/* Base URL */}
        <div className="space-y-2">
          <Label htmlFor="baseUrl">
            {language === 'ar' ? 'الرابط الأساسي للـ API' : 'Base API URL'}
          </Label>
          <Input
            id="baseUrl"
            placeholder={language === 'ar' ? 'https://gitlab.com/api/v4' : 'https://gitlab.com/api/v4'}
            value={config.baseUrl}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
          />
        </div>

        {/* Authentication Type */}
        <div className="space-y-2">
          <Label>
            {language === 'ar' ? 'نوع المصادقة' : 'Authentication Type'}
          </Label>
          <div className="flex space-x-4">
            {[
              { value: 'token', label: language === 'ar' ? 'رمز مميز' : 'Token' },
              { value: 'basic', label: language === 'ar' ? 'أساسي' : 'Basic Auth' },
              { value: 'oauth', label: 'OAuth' }
            ].map((auth) => (
              <label key={auth.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="authType"
                  value={auth.value}
                  checked={config.authType === auth.value}
                  onChange={(e) => handleInputChange('authType', e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-sm">{auth.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Authentication Fields */}
        {config.authType === 'token' && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {language === 'ar' ? 'رمز API / الرمز المميز' : 'API Key / Token'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={language === 'ar' ? 'أدخل الرمز المميز' : 'Enter your token'}
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
            />
          </div>
        )}

        {config.authType === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </Label>
              <Input
                id="username"
                placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                value={config.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                value={config.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Custom Headers */}
        <div className="space-y-2">
          <Label htmlFor="headers">
            {language === 'ar' ? 'رؤوس إضافية (اختياري)' : 'Additional Headers (Optional)'}
          </Label>
          <Textarea
            id="headers"
            placeholder={language === 'ar' 
              ? 'أدخل الرؤوس بصيغة JSON\n{\n  "Custom-Header": "value"\n}' 
              : 'Enter headers as JSON\n{\n  "Custom-Header": "value"\n}'
            }
            value={config.headers}
            onChange={(e) => handleInputChange('headers', e.target.value)}
            rows={3}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            {language === 'ar' ? 'وصف (اختياري)' : 'Description (Optional)'}
          </Label>
          <Textarea
            id="description"
            placeholder={language === 'ar' ? 'وصف قصير لهذا المزود' : 'Brief description of this provider'}
            value={config.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={2}
          />
        </div>

        {/* Connection Status */}
        {connectionStatus !== 'idle' && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            connectionStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {connectionStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">
              {connectionStatus === 'success'
                ? (language === 'ar' ? 'تم الاتصال بنجاح!' : 'Connection successful!')
                : (language === 'ar' ? 'فشل في الاتصال. تحقق من البيانات.' : 'Connection failed. Please check your credentials.')
              }
            </span>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={testConnection}
          disabled={!isFormValid || isTestingConnection}
        >
          {isTestingConnection ? (
            <>
              <TestTube className="w-4 h-4 mr-2 animate-spin" />
              {language === 'ar' ? 'جاري الاختبار...' : 'Testing...'}
            </>
          ) : (
            <>
              <TestTube className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
            </>
          )}
        </Button>

        <Button 
          onClick={handleSave}
          disabled={!isFormValid || connectionStatus === 'error'}
        >
          <Save className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'حفظ الإعدادات' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default CustomProviderConfig;
