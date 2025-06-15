
import { useState, useRef } from 'react';
import { Message, AIRole, Language } from '@/types/chat';

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<AIRole>('product-manager');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showQuickRepo, setShowQuickRepo] = useState(false);
  const [showAgentManagement, setShowAgentManagement] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentPanel = () => {
    if (showIntegrations) return 'integrations';
    if (showRoleManagement) return 'roles';
    if (showAgentManagement) return 'agents';
    return 'chat';
  };

  const setCurrentPanel = (panel: string) => {
    setShowIntegrations(panel === 'integrations');
    setShowRoleManagement(panel === 'roles');
    setShowAgentManagement(panel === 'agents');
  };

  return {
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
    showIntegrations,
    showRoleManagement,
    showQuickRepo,
    setShowQuickRepo,
    showAgentManagement,
    setShowAgentManagement,
    messagesEndRef,
    getCurrentPanel,
    setCurrentPanel
  };
};
