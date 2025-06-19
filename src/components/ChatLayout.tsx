import React from 'react';
import { Message, ConversationMemory, AIRole, Language } from '@/types/chat';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatActions from './ChatActions';
import ChatMainContent from './ChatMainContent';
import { getRoleConfig } from '@/config/roleConfig';

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
  onInputChange: (message: string) => void;
  onRoleChange: (role: AIRole) => void;
  onLanguageChange: (language: Language) => void;
  onPanelChange: (panel: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>; // Add this required prop
  
  // Handlers
  onExampleClick: (example: string) => void;
  onCreateNewConversation: () => void;
  onSaveCurrentConversation: () => void;
  onClearAllHistory: () => void;
  onLoadConversation: (conversationId: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBackClick?: () => void;
  onFileUpload?: (files: File[]) => void;
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
  onInputChange,
  onRoleChange,
  onLanguageChange,
  onPanelChange,
  setMessages, // Add this to destructuring
  onExampleClick,
  onCreateNewConversation,
  onSaveCurrentConversation,
  onClearAllHistory,
  onLoadConversation,
  onSendMessage,
  onKeyPress,
  onBackClick,
  onFileUpload
}) => {
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const isDynamicRole = currentRole?.isDynamic || false;

  return (
    <div className={`flex h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <ChatSidebar
        selectedRole={selectedRole}
        setSelectedRole={onRoleChange}
        language={language}
        setLanguage={onLanguageChange}
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
            <ChatHeader 
              selectedRole={selectedRole} 
              language={language}
              onBackClick={onBackClick}
              showBackButton={messages.length > 0}
            />
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
              setMessages={setMessages} // Pass the setMessages prop
            />
          </div>
        </div>

        {/* Chat Input - Show when in chat panel and not a dynamic role */}
        {currentPanel === 'chat' && !isDynamicRole && (
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={onInputChange}
            onSendMessage={onSendMessage}
            onKeyPress={onKeyPress}
            selectedRole={selectedRole}
            language={language}
            isLoading={isLoading}
            isDynamicRole={isDynamicRole}
            onFileUpload={onFileUpload}
          />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
