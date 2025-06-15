
import React from 'react';
import { Language } from '@/types/chat';
import AISettingsModal from './AISettingsModal';

interface ChatActionsProps {
  language: Language;
}

const ChatActions: React.FC<ChatActionsProps> = ({
  language
}) => {
  return (
    <div className="flex items-center space-x-2">
      <AISettingsModal language={language} />
    </div>
  );
};

export default ChatActions;
