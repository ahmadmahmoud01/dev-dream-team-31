
import { useState, useEffect } from 'react';
import { ConversationMemory, Message, AIRole } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

export const useConversationManager = (selectedRole: AIRole, language: 'ar' | 'en') => {
  const [conversations, setConversations] = useState<ConversationMemory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatbot-conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed.map((conv: any) => ({
        ...conv,
        lastUpdated: new Date(conv.lastUpdated),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = (newConversations: ConversationMemory[]) => {
    localStorage.setItem('chatbot-conversations', JSON.stringify(newConversations));
    setConversations(newConversations);
  };

  const createNewConversation = (roleConfig: any) => {
    const newConversation: ConversationMemory = {
      id: Date.now().toString(),
      title: `${roleConfig[selectedRole].name} - ${new Date().toLocaleDateString('ar')}`,
      messages: [],
      lastUpdated: new Date(),
      role: selectedRole
    };
    
    const updatedConversations = [...conversations, newConversation];
    saveConversations(updatedConversations);
    setCurrentConversationId(newConversation.id);

    toast({
      title: language === 'ar' ? 'تم إنشاء محادثة جديدة' : 'New conversation created',
      description: language === 'ar' ? 'يمكنك الآن بدء محادثة جديدة' : 'You can now start a new conversation'
    });

    return newConversation.id;
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      return conversation.messages;
    }
    return [];
  };

  const saveCurrentConversation = (messages: Message[]) => {
    if (!currentConversationId) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages,
          lastUpdated: new Date()
        };
      }
      return conv;
    });

    saveConversations(updatedConversations);
    
    toast({
      title: language === 'ar' ? 'تم حفظ المحادثة' : 'Conversation saved',
      description: language === 'ar' ? 'تم حفظ محادثتك بنجاح' : 'Your conversation has been saved successfully'
    });
  };

  const clearAllHistory = () => {
    setConversations([]);
    setCurrentConversationId(null);
    localStorage.removeItem('chatbot-conversations');
    
    toast({
      title: language === 'ar' ? 'تم مسح السجل' : 'History cleared',
      description: language === 'ar' ? 'تم مسح جميع المحادثات' : 'All conversations have been cleared'
    });
  };

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    loadConversation,
    saveCurrentConversation,
    clearAllHistory,
    setCurrentConversationId
  };
};
