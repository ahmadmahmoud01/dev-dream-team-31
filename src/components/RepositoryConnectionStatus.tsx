
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types/chat';
import { Project } from '@/types/integrations';
import { CheckCircle, AlertCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';

interface RepositoryConnectionStatusProps {
  language: Language;
  selectedRepository: { source: string; project: Project } | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}

const RepositoryConnectionStatus: React.FC<RepositoryConnectionStatusProps> = ({
  language,
  selectedRepository,
  connectionStatus,
  onConnect,
  onDisconnect,
  onRefresh
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-50 border-green-200';
      case 'connecting': return 'bg-blue-50 border-blue-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'connecting': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    const texts = {
      'ar': {
        'connected': 'متصل',
        'connecting': 'جاري الاتصال...',
        'disconnected': 'غير متصل',
        'error': 'خطأ في الاتصال'
      },
      'en': {
        'connected': 'Connected',
        'connecting': 'Connecting...',
        'disconnected': 'Disconnected',
        'error': 'Connection Error'
      }
    };
    return texts[language][connectionStatus];
  };

  if (!selectedRepository) {
    return (
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="text-center py-6">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {language === 'ar' ? 'لم يتم اختيار مستودع' : 'No Repository Selected'}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'ar' 
              ? 'يرجى اختيار مستودع للمتابعة' 
              : 'Please select a repository to continue'
            }
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 transition-all duration-200 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium text-gray-900">
              {selectedRepository.project.name}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedRepository.source} • {getStatusText()}
            </p>
          </div>
        </div>
        <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Repository Details */}
      <div className="space-y-2 mb-4">
        {selectedRepository.project.key && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              {language === 'ar' ? 'المفتاح:' : 'Key:'}
            </span>
            <span className="font-mono text-gray-700">
              {selectedRepository.project.key}
            </span>
          </div>
        )}
        {selectedRepository.project.status && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              {language === 'ar' ? 'الحالة:' : 'Status:'}
            </span>
            <span className="text-gray-700">
              {selectedRepository.project.status}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {connectionStatus === 'connected' ? (
          <>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              {language === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <ExternalLink className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'فتح المستودع' : 'Open Repository'}
            </Button>
          </>
        ) : (
          <Button 
            onClick={onConnect} 
            disabled={connectionStatus === 'connecting'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {connectionStatus === 'connecting' ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1" />
            )}
            {language === 'ar' ? 'ربط المستودع' : 'Connect Repository'}
          </Button>
        )}
      </div>

      {/* Connection Info */}
      {connectionStatus === 'connected' && (
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {language === 'ar' ? 'معلومات الاتصال' : 'Connection Info'}
          </h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              {language === 'ar' ? 'آخر مزامنة:' : 'Last Synced:'} {new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
            <div>
              {language === 'ar' ? 'حالة الأذونات:' : 'Permissions:'} 
              <Badge variant="outline" className="ml-1 text-xs">
                {language === 'ar' ? 'قراءة/كتابة' : 'Read/Write'}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RepositoryConnectionStatus;
