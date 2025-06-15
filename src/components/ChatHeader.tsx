
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';

interface ChatHeaderProps {
  selectedRole: AIRole;
  language: Language;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedRole, language }) => {
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <RoleIcon className="w-3 h-3" />
            <span>{currentRole.name}</span>
          </Badge>
          <span className="text-sm text-gray-600">{currentRole.description}</span>
        </div>
        
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          {t.export}
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
