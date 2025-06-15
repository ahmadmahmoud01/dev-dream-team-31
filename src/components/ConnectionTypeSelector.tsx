
import React from 'react';
import { Card } from '@/components/ui/card';
import { Language } from '@/types/chat';
import { Github, GitBranch, Settings, ExternalLink } from 'lucide-react';

type ConnectionType = 'github' | 'bitbucket' | 'devops';

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
      name: language === 'ar' ? 'GitHub' : 'GitHub',
      icon: <Github className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع مستودعات GitHub' : 'Connect to GitHub repositories',
      color: 'bg-gray-900'
    },
    {
      id: 'bitbucket' as ConnectionType,
      name: language === 'ar' ? 'Bitbucket' : 'Bitbucket',
      icon: <GitBranch className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع مستودعات Bitbucket' : 'Connect to Bitbucket repositories',
      color: 'bg-blue-700'
    },
    {
      id: 'devops' as ConnectionType,
      name: language === 'ar' ? 'Azure DevOps' : 'Azure DevOps',
      icon: <Settings className="w-5 h-5" />,
      description: language === 'ar' ? 'ربط مع Azure DevOps' : 'Connect to Azure DevOps',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === 'ar' ? 'اختيار نوع الربط' : 'Select Connection Type'}
        </h3>
      </div>

      <div className="space-y-3">
        {connectionTypes.map((connectionType) => (
          <Card
            key={connectionType.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-2 hover:border-blue-200"
            onClick={() => onSelectConnectionType(connectionType.id)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${connectionType.color} text-white`}>
                {connectionType.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{connectionType.name}</h4>
                <p className="text-sm text-gray-600">{connectionType.description}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConnectionTypeSelector;
