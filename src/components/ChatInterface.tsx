import React, { useState, useRef, useEffect } from 'react';
import { Message, AIRole, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { generateRoleBasedResponse } from '@/utils/aiResponseGenerator';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAISettings } from '@/hooks/useAISettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import AISettingsModal from './AISettingsModal';
import IntegrationsPanel from './IntegrationsPanel';
import RoleManagementPanel from './RoleManagementPanel';
import QuickRepositoryAccess from './QuickRepositoryAccess';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<AIRole>('tester');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showQuickRepo, setShowQuickRepo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExampleClick = (example: string) => {
    setInputMessage(example);
  };

  const handleCreateNewConversation = () => {
    const roleConfig = getRoleConfig(language);
    const newConversationId = createNewConversation(roleConfig);
    setMessages([]);
    setCurrentConversationId(newConversationId);
  };

  const handleLoadConversation = (conversationId: string) => {
    const conversationMessages = loadConversation(conversationId);
    setMessages(conversationMessages);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedRole(conversation.role);
    }
  };

  const handleSaveCurrentConversation = () => {
    if (!currentConversationId) {
      handleCreateNewConversation();
      return;
    }
    saveCurrentConversation(messages);
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateRoleBasedResponse(
        inputMessage, 
        selectedRole, 
        language, 
        aiSettings,
        integrations.settings
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        aiRole: selectedRole
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: language === 'ar' ? 'عذراً، حدث خطأ في توليد الاستجابة.' : 'Sorry, an error occurred while generating the response.',
        sender: 'ai',
        timestamp: new Date(),
        aiRole: selectedRole
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCurrentPanel = () => {
    if (showIntegrations) return 'integrations';
    if (showRoleManagement) return 'roles';
    return 'chat';
  };

  const setCurrentPanel = (panel: string) => {
    setShowIntegrations(panel === 'integrations');
    setShowRoleManagement(panel === 'roles');
  };

  return (
    <div className={`flex h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <ChatSidebar
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        language={language}
        setLanguage={setLanguage}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onCreateNewConversation={handleCreateNewConversation}
        onSaveCurrentConversation={handleSaveCurrentConversation}
        onClearAllHistory={handleClearAllHistory}
        onLoadConversation={handleLoadConversation}
        currentPanel={getCurrentPanel()}
        onPanelChange={setCurrentPanel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <ChatHeader selectedRole={selectedRole} language={language} />
            <div className="flex items-center space-x-2">
              <QuickRepositoryAccess 
                language={language}
                isOpen={showQuickRepo}
                onToggle={() => setShowQuickRepo(!showQuickRepo)}
              />
              <AISettingsModal language={language} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {showIntegrations ? (
              <IntegrationsPanel language={language} />
            ) : showRoleManagement ? (
              <RoleManagementPanel language={language} />
            ) : (
              <>
                {messages.length === 0 ? (
                  <WelcomeScreen
                    selectedRole={selectedRole}
                    language={language}
                    onExampleClick={handleExampleClick}
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
            )}
          </div>
        </div>

        {/* Chat Input - Only show when in chat panel */}
        {getCurrentPanel() === 'chat' && (
          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            selectedRole={selectedRole}
            language={language}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
