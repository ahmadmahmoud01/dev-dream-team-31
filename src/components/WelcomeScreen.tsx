
import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';

interface WelcomeScreenProps {
  selectedRole: AIRole;
  language: Language;
  onExampleClick: (example: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  selectedRole,
  language,
  onExampleClick,
}) => {
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  return (
    <div className="text-center py-8">
      <div className={`inline-flex p-4 rounded-full ${currentRole.color} text-white mb-4`}>
        <RoleIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t.hello} {currentRole.name}
      </h3>
      <p className="text-gray-600 mb-6">{currentRole.description}</p>
      
      {/* Examples Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h4 className="text-md font-medium text-gray-800">{t.examples}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentRole.examples.map((example, index) => (
            <Card
              key={index}
              className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500 bg-white"
              onClick={() => onExampleClick(example)}
            >
              <p className="text-sm text-gray-700 text-right">{example}</p>
            </Card>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-gray-500">
        {t.getStarted}
      </p>
    </div>
  );
};

export default WelcomeScreen;
