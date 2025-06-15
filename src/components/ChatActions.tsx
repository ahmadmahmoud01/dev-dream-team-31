
import React from 'react';
import { Language } from '@/types/chat';
import QuickRepositoryAccess from './QuickRepositoryAccess';
import AISettingsModal from './AISettingsModal';

interface ChatActionsProps {
  language: Language;
  showQuickRepo: boolean;
  onToggleQuickRepo: () => void;
}

const ChatActions: React.FC<ChatActionsProps> = ({
  language,
  showQuickRepo,
  onToggleQuickRepo
}) => {
  return (
    <div className="flex items-center space-x-2">
      <QuickRepositoryAccess 
        language={language}
        isOpen={showQuickRepo}
        onToggle={onToggleQuickRepo}
      />
      <AISettingsModal language={language} />
    </div>
  );
};

export default ChatActions;
