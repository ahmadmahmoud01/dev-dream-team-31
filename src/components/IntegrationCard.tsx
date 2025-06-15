
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { IntegrationConfig, IntegrationType } from '@/types/integrations';
import { useIntegrations } from '@/hooks/useIntegrations';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IntegrationCardProps {
  config: IntegrationConfig;
  language: 'ar' | 'en';
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ config, language }) => {
  const { settings, saveIntegrationSettings, testConnection, isLoading } = useIntegrations();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings[config.id] || {});
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const currentSettings = settings[config.id] || {};
  const isEnabled = currentSettings.enabled || false;

  const handleSave = () => {
    saveIntegrationSettings(config.id, tempSettings);
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ إعدادات التكامل بنجاح' : 'Integration settings saved successfully'
    });
    setIsExpanded(false);
  };

  const handleTestConnection = async () => {
    const success = await testConnection(config.id);
    setConnectionStatus(success ? 'success' : 'error');
    
    toast({
      title: success 
        ? (language === 'ar' ? 'نجح الاتصال' : 'Connection Successful')
        : (language === 'ar' ? 'فشل الاتصال' : 'Connection Failed'),
      description: success
        ? (language === 'ar' ? 'تم الاتصال بنجاح' : 'Successfully connected to the service')
        : (language === 'ar' ? 'تحقق من الإعدادات' : 'Please check your settings'),
      variant: success ? 'default' : 'destructive'
    });
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (connectionStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (connectionStatus === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.color} text-white text-xl`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{config.name}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled 
              ? (language === 'ar' ? 'مفعل' : 'Enabled')
              : (language === 'ar' ? 'معطل' : 'Disabled')
            }
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => {
              saveIntegrationSettings(config.id, { ...currentSettings, enabled: checked });
            }}
          />
          <Label>{language === 'ar' ? 'تفعيل التكامل' : 'Enable Integration'}</Label>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {language === 'ar' ? 'الإعدادات' : 'Settings'}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {config.fields.apiKey && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'مفتاح API' : 'API Key'}</Label>
              <Input
                type="password"
                value={tempSettings.apiKey || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, apiKey: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل مفتاح API...' : 'Enter API key...'}
              />
            </div>
          )}

          {config.fields.serverUrl && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'رابط الخادم' : 'Server URL'}</Label>
              <Input
                value={tempSettings.serverUrl || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, serverUrl: e.target.value })}
                placeholder={language === 'ar' ? 'https://your-server.com' : 'https://your-server.com'}
              />
            </div>
          )}

          {config.fields.projectKey && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'مفتاح المشروع' : 'Project Key'}</Label>
              <Input
                value={tempSettings.projectKey || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, projectKey: e.target.value })}
                placeholder={language === 'ar' ? 'PROJECT-KEY' : 'PROJECT-KEY'}
              />
            </div>
          )}

          {config.fields.workspaceId && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'معرف مساحة العمل' : 'Workspace ID'}</Label>
              <Input
                value={tempSettings.workspaceId || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, workspaceId: e.target.value })}
                placeholder={language === 'ar' ? '123456789' : '123456789'}
              />
            </div>
          )}

          {config.fields.username && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
              <Input
                value={tempSettings.username || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, username: e.target.value })}
                placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
              />
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button onClick={handleSave} size="sm">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isLoading}
              size="sm"
            >
              {isLoading
                ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...')
                : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')
              }
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              size="sm"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default IntegrationCard;
