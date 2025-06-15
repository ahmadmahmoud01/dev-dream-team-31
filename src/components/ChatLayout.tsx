
import React from 'react';
import { Message, ConversationMemory, AIRole, Language } from '@/types/chat';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatActions from './ChatActions';
import ChatMainContent from './ChatMainContent';

interface ChatLayoutProps {
  // State
  messages: Message[];
  inputMessage: string;
  selectedRole: AIRole;
  language: Language;
  isLoading: boolean;
  currentPanel: string;
  conversations: ConversationMemory[];
  currentConversationId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  
  // Setters
  setInputMessage: (message: string) => void;
  setSelectedRole: (role: AIRole) => void;
  setLanguage: (language: Language) => void;
  onPanelChange: (panel: string) => void;
  
  // Handlers
  onExampleClick: (example: string) => void;
  onCreateNewConversation: () => void;
  onSaveCurrentConversation: () => void;
  onClearAllHistory: () => void;
  onLoadConversation: (conversationId: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  messages,
  inputMessage,
  selectedRole,
  language,
  isLoading,
  currentPanel,
  conversations,
  currentConversationId,
  messagesEndRef,
  setInputMessage,
  setSelectedRole,
  setLanguage,
  onPanelChange,
  onExampleClick,
  onCreateNewConversation,
  onSaveCurrentConversation,
  onClearAllHistory,
  onLoadConversation,
  onSendMessage,
  onKeyPress
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <ChatSidebar
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        language={language}
        setLanguage={setLanguage}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onCreateNewConversation={onCreateNewConversation}
        onSaveCurrentConversation={onSaveCurrentConversation}
        onClearAllHistory={onClearAllHistory}
        onLoadConversation={onLoadConversation}
        currentPanel={currentPanel}
        onPanelChange={onPanelChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <ChatHeader selectedRole={selectedRole} language={language} />
            <ChatActions language={language} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <ChatMainContent
              currentPanel={currentPanel}
              messages={messages}
              selectedRole={selectedRole}
              language={language}
              isLoading={isLoading}
              onExampleClick={onExampleClick}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </div>

        {/* Chat Input - Only show when in chat panel */}
        {currentPanel === 'chat' && (
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={onSendMessage}
            onKeyPress={onKeyPress}
            selectedRole={selectedRole}
            language={language}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
