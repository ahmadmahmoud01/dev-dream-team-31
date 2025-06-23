import React, { useState } from 'react';
import { Message, AIRole, Language } from '@/types/chat';
import WelcomeScreen from './WelcomeScreen';
import MessageList from './MessageList';
import IntegrationsPanel from './IntegrationsPanel';
import RoleManagementPanel from './RoleManagementPanel';
import AgentManagementPanel from './AgentManagementPanel';
import AzureDevOpsPrompt from '../chat/AzureDevOpsPrompt';
import InteractiveButtons from '../chat/InteractiveButtons'; // ✅ NEW: Import interactive buttons
import { useIntegrations } from '@/hooks/useIntegrations';

// ✅ ENHANCED: Extended Message type to support buttons
interface EnhancedMessage extends Message {
  buttons?: Array<{
    id: string;
    text: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
  }>;
}

interface ChatMainContentProps {
  currentPanel: string;
  messages: Message[];
  selectedRole: AIRole;
  language: Language;
  isLoading: boolean;
  onExampleClick: (example: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onButtonClick?: (action: string) => void;
  conversationState?: string;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  currentPanel,
  messages,
  selectedRole,
  language,
  isLoading,
  onExampleClick,
  messagesEndRef,
  setMessages,
  onButtonClick,
  conversationState
}) => {
  const { settings, isAzureDevOpsEnabled, hasValidAzureDevOpsConfig } = useIntegrations();
  const [azureDevOpsResponses, setAzureDevOpsResponses] = useState<Record<string, 'yes' | 'no'>>({});

  // Handle Azure DevOps prompt response
  const handleAzureDevOpsResponse = (messageId: string, response: 'yes' | 'no') => {
    setAzureDevOpsResponses(prev => ({
      ...prev,
      [messageId]: response
    }));

    if (response === 'no') {
      // Don't add any reply message for 'no' response
      return;
    }

    // For 'yes' response, the AzureDevOpsPrompt component will handle the file upload UI
  };

  // Handle successful task creation
  const handleTasksCreated = (messageId: string, result: any) => {
    const azureDevOpsConfig = settings.devops;
    
    const tasksMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `✅ **Azure DevOps Tasks Created Successfully!**\n\n🎯 **Tasks Created:** ${result.createdTasks?.length || 0}\n📋 **Project:** ${azureDevOpsConfig?.projectName || 'N/A'}\n⚙️ **Organization:** ${azureDevOpsConfig?.organizationUrl || 'N/A'}\n\n### 📝 **Task Details:**\n\n${result.createdTasks?.map((task: any, index: number) => 
        `**Task ${index + 1}:** Work Item #${task.workItemId}\n**Assigned to:** ${task.email}\n**Role:** ${task.role}\n`
      ).join('\n') || ''}\n\n---\n\n🎉 **All team members have been assigned their tasks in Azure DevOps!**\n\nYou can now track progress and manage the implementation through your Azure DevOps project dashboard.\n\n### 🔗 **Next Steps:**\n\n• Check your Azure DevOps project for the new work items\n• Team members will receive notifications about their assigned tasks\n• Monitor progress through the Azure DevOps dashboard\n• Use the work item IDs to track specific tasks`,
      timestamp: new Date(),
      aiRole: 'product-manager'
    };
    
    setMessages(prev => [...prev, tasksMessage]);

    // Remove the Azure DevOps response state for this message
    setAzureDevOpsResponses(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  };

  // Handle task creation failure
  const handleTaskCreationError = (messageId: string, error: string) => {
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `❌ **Failed to Create Azure DevOps Tasks**\n\n🚫 **Error:** ${error}\n\n### 🔧 **Troubleshooting Steps:**\n\n1. **Check Azure DevOps Configuration:**\n   - Verify your Personal Access Token is valid\n   - Ensure Organization URL is correct\n   - Confirm Project Name exists\n\n2. **Team Members Setup:**\n   - Verify team member emails are valid\n   - Check if team members have access to the project\n   - Ensure roles are properly assigned\n\n3. **Permissions:**\n   - Confirm your PAT has work item creation permissions\n   - Check if you have contributor access to the project\n\n### 💡 **Need Help?**\nTry reconfiguring your Azure DevOps integration in the Integrations panel.`,
      timestamp: new Date(),
      aiRole: 'product-manager'
    };
    
    setMessages(prev => [...prev, errorMessage]);

    // Remove the Azure DevOps response state for this message
    setAzureDevOpsResponses(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  };

  // ✅ NEW: Enhanced Message Display Component with Button Support
  const MessageDisplay: React.FC<{ 
    message: EnhancedMessage; 
    language: Language; 
    onButtonClick?: (action: string) => void;
  }> = ({ message, language, onButtonClick }) => {
    return (
      <div className="message-container">
        {/* Render the original message */}
        <MessageList
          messages={[message]}
          language={language}
          isLoading={false}
        />
        
        {/* ✅ NEW: Render interactive buttons if they exist */}
        {message.buttons && message.buttons.length > 0 && onButtonClick && (
          <div className="mt-3">
            <InteractiveButtons
              buttons={message.buttons}
              onButtonClick={onButtonClick}
              language={language}
            />
          </div>
        )}
        
        {/* Show Azure DevOps prompt if this message has the flag and user hasn't responded yet */}
        {message.showAzureDevOpsPrompt && 
         selectedRole === 'product-manager' && 
         !azureDevOpsResponses[message.id] && (
          <div className="mt-4">
            <AzureDevOpsPrompt
              language={language}
              onResponse={(response) => handleAzureDevOpsResponse(message.id, response)}
              onTasksCreated={(result) => handleTasksCreated(message.id, result)}
              onError={(error) => handleTaskCreationError(message.id, error)}
            />
          </div>
        )}
      </div>
    );
  };

  // ✅ ENHANCED: MessageList component with interactive button support
  const EnhancedMessageList: React.FC<{ 
    messages: Message[]; 
    language: Language; 
    isLoading: boolean;
    onButtonClick?: (action: string) => void;
  }> = ({ messages, language, isLoading, onButtonClick }) => {
    return (
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageDisplay
            key={message.id}
            message={message as EnhancedMessage}
            language={language}
            onButtonClick={onButtonClick}
          />
        ))}
        
        {/* Show loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ✅ NEW: Conversational State Indicator (optional visual feedback)
  const ConversationStateIndicator: React.FC<{ 
    state?: string; 
    language: Language; 
  }> = ({ state, language }) => {
    if (!state || selectedRole !== 'product-manager') return null;

    const getStateText = (state: string) => {
      switch (state) {
        case 'initial':
          return language === 'ar' ? 'جاهز لبدء العملية' : 'Ready to start';
        case 'awaiting_files':
          return language === 'ar' ? 'في انتظار تحميل الملفات' : 'Awaiting file upload';
        case 'prd_generated':
          return language === 'ar' ? 'تم إنشاء مستند PRD' : 'PRD generated';
        case 'azure_prompt':
          return language === 'ar' ? 'في انتظار قرار Azure DevOps' : 'Awaiting Azure DevOps decision';
        case 'tasks_created':
          return language === 'ar' ? 'تم إنشاء المهام' : 'Tasks created';
        default:
          return '';
      }
    };

    const stateText = getStateText(state);
    if (!stateText) return null;

    return (
      <div className="mb-4 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-blue-700 font-medium">
            {language === 'ar' ? 'حالة المحادثة:' : 'Conversation State:'} {stateText}
          </span>
        </div>
      </div>
    );
  };

  // Panel routing
  if (currentPanel === 'integrations') {
    return <IntegrationsPanel language={language} />;
  }

  if (currentPanel === 'roles') {
    return <RoleManagementPanel language={language} />;
  }

  if (currentPanel === 'agents') {
    return <AgentManagementPanel language={language} />;
  }

  // Main chat content
  return (
    <>
      {/* ✅ NEW: Show conversation state indicator for Product Manager */}
      <ConversationStateIndicator 
        state={conversationState} 
        language={language} 
      />
      
      {messages.length === 0 ? (
        <WelcomeScreen
          selectedRole={selectedRole}
          language={language}
          onExampleClick={onExampleClick}
        />
      ) : (
        <EnhancedMessageList
          messages={messages}
          language={language}
          isLoading={isLoading}
          onButtonClick={onButtonClick} // ✅ NEW: Pass button click handler
        />
      )}
      <div ref={messagesEndRef} />
    </>
  );
};

export default ChatMainContent;
