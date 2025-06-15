
import React from 'react';
import { Message, AIRole, Language } from '@/types/chat';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import IntegrationsPanel from './IntegrationsPanel';
import RoleManagementPanel from './RoleManagementPanel';

interface ChatMainContentProps {
  currentPanel: string;
  messages: Message[];
  selectedRole: AIRole;
  language: Language;
  isLoading: boolean;
  onExampleClick: (example: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  currentPanel,
  messages,
  selectedRole,
  language,
  isLoading,
  onExampleClick,
  messagesEndRef
}) => {
  if (currentPanel === 'integrations') {
    return <IntegrationsPanel language={language} />;
  }

  if (currentPanel === 'roles') {
    return <RoleManagementPanel language={language} />;
  }

  return (
    <>
      {messages.length === 0 ? (
        <WelcomeScreen
          selectedRole={selectedRole}
          language={language}
          onExampleClick={onExampleClick}
        />
      ) : (
        <MessageList
          messages={messages}
          language={language}
          isLoading={isLoading}
        />
      )}
      <div ref={messagesEndRef} />
    </>
  );
};

export default ChatMainContent;
