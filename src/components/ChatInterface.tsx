
import React, { useState, useRef, useEffect } from 'react';
import { Message, AIRole, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { generateRoleBasedResponse } from '@/utils/aiResponseGenerator';
import { useConversationManager } from '@/hooks/useConversationManager';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<AIRole>('tester');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Simulate AI response based on role
    setTimeout(() => {
      const aiResponse = generateRoleBasedResponse(inputMessage, selectedRole, language);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        aiRole: selectedRole
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader selectedRole={selectedRole} language={language} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
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
          </div>
        </div>

        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          selectedRole={selectedRole}
          language={language}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
