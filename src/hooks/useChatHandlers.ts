
import { useEffect } from 'react';
import { Message, AIRole, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { generateRoleBasedResponse } from '@/utils/aiResponseGenerator';

interface UseChatHandlersProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  selectedRole: AIRole;
  setSelectedRole: (role: AIRole) => void;
  language: Language;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  conversations: any[];
  currentConversationId: string | null;
  createNewConversation: (roleConfig: any) => string;
  loadConversation: (conversationId: string) => Message[];
  saveCurrentConversation: (messages: Message[]) => void;
  clearAllHistory: () => void;
  setCurrentConversationId: (id: string) => void;
  aiSettings: any;
  integrations: any;
}

export const useChatHandlers = ({
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
}: UseChatHandlersProps) => {

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

  return {
    handleExampleClick,
    handleCreateNewConversation,
    handleLoadConversation,
    handleSaveCurrentConversation,
    handleClearAllHistory,
    handleSendMessage,
    handleKeyPress
  };
};
