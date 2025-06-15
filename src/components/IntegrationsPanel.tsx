
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap } from 'lucide-react';
import { Language } from '@/types/chat';
import { INTEGRATIONS_CONFIG } from '@/config/integrationsConfig';
import { useIntegrations } from '@/hooks/useIntegrations';
import IntegrationCard from './IntegrationCard';

interface IntegrationsPanelProps {
  language: Language;
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ language }) => {
  const { settings } = useIntegrations();

  const enabledIntegrations = Object.entries(settings).filter(([_, config]) => config.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'لوحة التكاملات' : 'Integrations Panel'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'قم بربط التطبيق مع أدوات العمل المختلفة'
                : 'Connect your app with various work tools'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <Badge variant="outline">
            {enabledIntegrations} {language === 'ar' ? 'مفعل' : 'Active'}
          </Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{enabledIntegrations}</div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'تكاملات نشطة' : 'Active Integrations'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {INTEGRATIONS_CONFIG.length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'إجمالي التكاملات' : 'Total Available'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'المزامنة' : 'Sync Status'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {language === 'ar' ? 'آمن' : 'Secure'}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'التشفير' : 'Encryption'}
            </div>
          </div>
        </div>
      </Card>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {INTEGRATIONS_CONFIG.map((config) => (
          <IntegrationCard
            key={config.id}
            config={config}
            language={language}
          />
        ))}
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'ar' ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
        </h3>
        <p className="text-gray-600 mb-4">
          {language === 'ar'
            ? 'تواصل مع فريق الدعم للحصول على المساعدة في إعداد التكاملات'
            : 'Contact our support team for help setting up integrations'
          }
        </p>
        <div className="flex space-x-4 text-sm">
          <span className="text-blue-600 cursor-pointer hover:underline">
            {language === 'ar' ? 'وثائق API' : 'API Documentation'}
          </span>
          <span className="text-blue-600 cursor-pointer hover:underline">
            {language === 'ar' ? 'أمثلة التكامل' : 'Integration Examples'}
          </span>
          <span className="text-blue-600 cursor-pointer hover:underline">
            {language === 'ar' ? 'الدعم الفني' : 'Technical Support'}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationsPanel;
