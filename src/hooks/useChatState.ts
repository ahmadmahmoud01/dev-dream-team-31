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
    // Reset all panel states first
    setShowIntegrations(false);
    setShowRoleManagement(false);
    setShowAgentManagement(false);
    
    // Set the active panel
    switch (panel) {
      case 'integrations':
        setShowIntegrations(true);
        break;
      case 'roles':
        setShowRoleManagement(true);
        break;
      case 'agents':
        setShowAgentManagement(true);
        break;
      case 'chat':
      default:
        // All panels are already false, so chat is active
        break;
    }
  };

  // Add currentPanel as a computed property for easier access
  const currentPanel = getCurrentPanel();

  return {
    // Messages and input
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    
    // Role and language
    selectedRole,
    setSelectedRole,
    language,
    setLanguage,
    
    // Loading state
    isLoading,
    setIsLoading,
    
    // Panel states (individual)
    showIntegrations,
    showRoleManagement,
    showQuickRepo,
    setShowQuickRepo,
    showAgentManagement,
    setShowAgentManagement,
    
    // Panel management (unified)
    currentPanel, // Add this as a direct property
    getCurrentPanel,
    setCurrentPanel,
    
    // Refs
    messagesEndRef,
  };
};
