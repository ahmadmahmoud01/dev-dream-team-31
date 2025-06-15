
import React from 'react';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAISettings } from '@/hooks/useAISettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatState } from '@/hooks/useChatState';
import { useChatHandlers } from '@/hooks/useChatHandlers';
import ChatLayout from './ChatLayout';

const ChatInterface = () => {
  const chatState = useChatState();
  const {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    selectedRole,
    setSelectedRole,
    isLoading,
    setIsLoading,
    language,
    setLanguage,
    messagesEndRef,
    getCurrentPanel,
    setCurrentPanel
  } = chatState;

  const aiSettings = useAISettings();
  const integrations = useIntegrations();

  const {
    conversations,
    currentConversationId,
    createNewConversation,
    loadConversation,
    saveCurrentConversation,
    clearAllHistory,
    setCurrentConversationId
  } = useConversationManager(selectedRole, language);

  const handlers = useChatHandlers({
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    selectedRole,
    setSelectedRole,
    language,
    isLoading,
    setIsLoading,
    messagesEndRef,
    conversations,
    currentConversationId,
    createNewConversation,
    loadConversation,
    saveCurrentConversation,
    clearAllHistory,
    setCurrentConversationId,
    aiSettings,
    integrations
  });

  return (
    <ChatLayout
      messages={messages}
      inputMessage={inputMessage}
      selectedRole={selectedRole}
      language={language}
      isLoading={isLoading}
      currentPanel={getCurrentPanel()}
      conversations={conversations}
      currentConversationId={currentConversationId}
      messagesEndRef={messagesEndRef}
      setInputMessage={setInputMessage}
      setSelectedRole={setSelectedRole}
      setLanguage={setLanguage}
      onPanelChange={setCurrentPanel}
      onExampleClick={handlers.handleExampleClick}
      onCreateNewConversation={handlers.handleCreateNewConversation}
      onSaveCurrentConversation={handlers.handleSaveCurrentConversation}
      onClearAllHistory={handlers.handleClearAllHistory}
      onLoadConversation={handlers.handleLoadConversation}
      onSendMessage={handlers.handleSendMessage}
      onKeyPress={handlers.handleKeyPress}
    />
  );
};

export default ChatInterface;
