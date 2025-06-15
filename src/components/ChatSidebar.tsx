
import React from 'react';
import { FileText, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConversationMemory, AIRole, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';

interface ChatSidebarProps {
  selectedRole: AIRole;
  setSelectedRole: (role: AIRole) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  conversations: ConversationMemory[];
  currentConversationId: string | null;
  onCreateNewConversation: () => void;
  onSaveCurrentConversation: () => void;
  onClearAllHistory: () => void;
  onLoadConversation: (conversationId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  selectedRole,
  setSelectedRole,
  language,
  setLanguage,
  conversations,
  currentConversationId,
  onCreateNewConversation,
  onSaveCurrentConversation,
  onClearAllHistory,
  onLoadConversation,
}) => {
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${currentRole.color} text-white`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant={language === 'ar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('ar')}
          >
            العربية
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
          >
            English
          </Button>
        </div>

        {/* Role Selection Grid */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">اختر الموظف</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(roleConfig).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = selectedRole === key;
              return (
                <Card
                  key={key}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? `ring-2 ring-blue-500 ${config.color} text-white` 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRole(key as AIRole)}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {config.name}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" onClick={onCreateNewConversation} className="flex-1">
            <FileText className="w-4 h-4 mr-1" />
            {t.newChat}
          </Button>
          <Button size="sm" variant="outline" onClick={onSaveCurrentConversation}>
            <Save className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onClearAllHistory}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">المحادثات السابقة</h3>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                currentConversationId === conversation.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onLoadConversation(conversation.id)}
            >
              <div className="flex items-center space-x-2 mb-1">
                <div className={`p-1 rounded ${roleConfig[conversation.role].color} text-white`}>
                  {React.createElement(roleConfig[conversation.role].icon, { className: 'w-3 h-3' })}
                </div>
                <span className="text-xs font-medium">{roleConfig[conversation.role].name}</span>
              </div>
              <p className="text-xs text-gray-600 truncate">{conversation.title}</p>
              <p className="text-xs text-gray-400">{conversation.lastUpdated.toLocaleDateString('ar')}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
