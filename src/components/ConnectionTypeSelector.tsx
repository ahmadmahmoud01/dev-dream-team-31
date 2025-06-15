
import React from 'react';
import { Card } from '@/components/ui/card';
import { Language } from '@/types/chat';
import { Github, GitBranch, Settings, ExternalLink, Shield, Server } from 'lucide-react';

type ConnectionType = 'github' | 'bitbucket' | 'devops' | 'devops-user' | 'security';

interface ConnectionTypeSelectorProps {
  language: Language;
  onSelectConnectionType: (type: ConnectionType) => void;
}

const ConnectionTypeSelector: React.FC<ConnectionTypeSelectorProps> = ({
  language,
  onSelectConnectionType
}) => {
  const connectionTypes = [
    {
      id: 'github' as ConnectionType,
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع مستودعات GitHub' : 'Connect to GitHub repositories',
      color: 'bg-gray-900'
    },
    {
      id: 'bitbucket' as ConnectionType,
      name: 'Bitbucket',
      icon: <GitBranch className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع مستودعات Bitbucket' : 'Connect to Bitbucket repositories',
      color: 'bg-blue-700'
    },
    {
      id: 'devops' as ConnectionType,
      name: 'Azure DevOps',
      icon: <Settings className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع Azure DevOps' : 'Connect to Azure DevOps',
      color: 'bg-indigo-500'
    },
    {
      id: 'devops-user' as ConnectionType,
      name: language === 'ar' ? 'مستخدم DevOps' : 'DevOps User',
      icon: <Server className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط كمستخدم DevOps' : 'Connect as DevOps User',
      color: 'bg-purple-600'
    },
    {
      id: 'security' as ConnectionType,
      name: language === 'ar' ? 'مستخدم الأمان' : 'Security User',
      icon: <Shield className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط كمستخدم أمان' : 'Connect as Security User',
      color: 'bg-red-600'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'ar' ? 'اختيار نوع الربط' : 'Select Connection Type'}
        </h3>
      </div>

      <div className="grid gap-3">
        {connectionTypes.map((connectionType) => (
          <Card
            key={connectionType.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-2 hover:border-blue-200 hover:shadow-md"
            onClick={() => onSelectConnectionType(connectionType.id)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${connectionType.color} text-white flex-shrink-0`}>
                {connectionType.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{connectionType.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{connectionType.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConnectionTypeSelector;
