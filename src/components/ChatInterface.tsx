import React from 'react';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAISettings } from '@/hooks/useAISettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatState } from '@/hooks/useChatState';
import { useChatHandlers } from '@/hooks/useChatHandlers';
import ChatLayout from './ChatLayout';
import { AIRole, Language, Message } from '@/types/chat';
import { prdService } from '@/services/prdService';
import { azureDevOpsService } from '@/services/azureDevOpsService';

const ChatInterface = () => {
  // Chat State Management
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
    currentPanel,
    setCurrentPanel
  } = useChatState();

  // AI and Integration Settings - MOVED TO COMPONENT LEVEL
  const aiSettings = useAISettings();
  const { 
    isAzureDevOpsEnabled, 
    hasValidAzureDevOpsConfig, 
    settings 
  } = useIntegrations();

  // Conversation Management
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    loadConversation,
    saveCurrentConversation,
    clearAllHistory,
    setCurrentConversationId
  } = useConversationManager(selectedRole, language);

  // FIXED: Automated File Upload Handler with Azure DevOps Integration
  const handleFileUpload = async (files: File[]) => {
    if (selectedRole !== 'product-manager') return;
    if (files.length === 0) return;

    // Add user message showing multiple file upload
    const fileList = files.map(file => `• ${file.name} (${(file.size / 1024).toFixed(2)} KB)`).join('\n');
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      sender: 'user',
      content: `📁 **Uploading ${files.length} files:**\n\n${fileList}\n\n📄 **Total size:** ${(totalSize / 1024).toFixed(2)} KB\n\n🔄 **Status:** Processing files and generating comprehensive PRD document...\n\nPlease wait while I analyze your requirements and prepare for Azure DevOps integration.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, uploadMessage]);
    setIsLoading(true);

    try {
      // Step 1: Test backend connection
      const isBackendConnected = await prdService.testConnection();
      
      if (!isBackendConnected) {
        throw new Error('Backend server is not running. Please make sure the Node.js server is started on port 8000.');
      }

      // Step 2: Generate PRD using Node.js backend
      const result = await prdService.generatePRDFromMultipleFiles(files);

      if (result.success) {
        // Step 3: Use hooks that are now available at component level
        const azureDevOpsConfig = settings.devops;
        const teamMembers = azureDevOpsConfig?.teamMembers || [];

        let successContent = `✅ **PRD Document Generated Successfully from ${files.length} Files!**\n\n📄 **Generated File:** PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx\n\n🎯 **Source Files:** ${files.length} requirement documents\n📅 **Generated:** ${new Date().toLocaleDateString()}\n📊 **Status:** Complete\n\n---\n\n### 📋 **Document Contents Include:**\n\n• **Consolidated Product Overview** - Unified vision from all sources\n• **Comprehensive User Analysis** - Combined user insights and personas\n• **Integrated Feature Set** - Features from all requirement documents\n• **Unified User Stories** - Development-ready stories from all sources\n• **Complete Technical Requirements** - System specs from all files\n\n---\n\n🎉 **The comprehensive PRD document has been automatically downloaded!**`;

        // Step 4: Automatically create Azure DevOps tasks if configured
        if (isAzureDevOpsEnabled() && hasValidAzureDevOpsConfig() && teamMembers.length > 0) {
          try {
            console.log('=== STARTING AUTOMATED AZURE DEVOPS INTEGRATION ===');
            console.log('Team members configured:', teamMembers.length);
            console.log('Azure DevOps project:', azureDevOpsConfig?.projectName);

            // Create tasks automatically using the PRD file name as reference
            const taskResult = await azureDevOpsService.createTasksFromPRD(
              {
                personalAccessToken: azureDevOpsConfig.personalAccessToken,
                organizationUrl: azureDevOpsConfig.organizationUrl,
                projectName: azureDevOpsConfig.projectName
              },
              `PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx`,
              teamMembers.map(member => ({
                email: member.email,
                role: member.role
              }))
            );

            if (taskResult.success) {
              successContent += `\n\n---\n\n✅ **Azure DevOps Tasks Created Automatically!**\n\n🎯 **Tasks Created:** ${taskResult.createdTasks?.length || 0}\n📋 **Project:** ${azureDevOpsConfig?.projectName}\n⚙️ **Organization:** ${azureDevOpsConfig?.organizationUrl}\n\n### 📝 **Work Item Details:**\n\n${taskResult.createdTasks?.map((task: any, index: number) => 
                `**Work Item #${task.workItemId}**\n**Assigned to:** ${task.email}\n**Role:** ${task.role}\n**Type:** Task\n`
              ).join('\n') || ''}\n\n🎉 **All team members have been assigned their tasks in Azure DevOps!**\n\n### 🔗 **Next Steps:**\n\n• Check your Azure DevOps project for the new work items\n• Team members will receive notifications about their assigned tasks\n• Monitor progress through the Azure DevOps dashboard\n• Use the work item IDs to track specific tasks`;
            } else {
              successContent += `\n\n---\n\n⚠️ **Azure DevOps Task Creation Failed**\n\n🚫 **Error:** ${taskResult.error}\n\n💡 **Note:** Your PRD was generated successfully, but automatic task creation encountered an issue. You can manually create tasks later through the integrations panel.`;
            }
          } catch (azureError) {
            console.error('Azure DevOps integration error:', azureError);
            successContent += `\n\n---\n\n⚠️ **Azure DevOps Integration Error**\n\n🚫 **Error:** ${azureError instanceof Error ? azureError.message : 'Unknown error'}\n\n💡 **Note:** Your PRD was generated successfully, but automatic Azure DevOps integration encountered an issue.`;
          }
        } else {
          // Add prompt for Azure DevOps configuration if not set up
          const configStatus = getAzureDevOpsConfigStatus();
          successContent += `\n\n---\n\n💡 **Want to Create Azure DevOps Tasks Automatically?**\n\n${configStatus}\n\nTo enable automatic task creation from your PRD:\n\n1. **Configure Azure DevOps** in the Integrations panel\n2. **Add team members** with their roles\n3. **Enable the integration**\n\nOnce configured, future PRD generations will automatically create tasks!`;
        }

        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: successContent,
          timestamp: new Date(),
          aiRole: 'product-manager'
        };

        setMessages(prev => [...prev, successMessage]);
      } else {
        // Handle PRD generation failure
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: `❌ **Error Generating PRD from Multiple Files**\n\n🚫 **Error Details:** ${result.error}\n\n### 🔧 **Troubleshooting Steps:**\n\n1. **Check Backend Server:**\n   - Ensure Node.js server is running on port 8000\n   - Run \`npm run dev\` in the backend directory\n\n2. **File Requirements:**\n   - All files should be readable text format\n   - Maximum 5 files at once\n   - Each file under 10MB\n   - Supported formats: .txt, .md, .doc, .docx, .pdf`,
          timestamp: new Date(),
          aiRole: 'product-manager'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      console.error('Error in automated workflow:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        sender: 'ai',
        content: `❌ **Automated Workflow Error**\n\n🚫 **Error:** ${error.message}\n\n### 🔄 **What Happened:**\nThe automated PRD generation and Azure DevOps integration workflow encountered an issue.\n\n### 💡 **Solutions:**\n• Check your internet connection\n• Verify backend server is running\n• Ensure Azure DevOps configuration is correct\n• Try uploading fewer or smaller files`,
        timestamp: new Date(),
        aiRole: 'product-manager'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check Azure DevOps configuration status
  const getAzureDevOpsConfigStatus = () => {
    const azureDevOpsConfig = settings.devops;
    const teamMembers = azureDevOpsConfig?.teamMembers || [];

    if (!isAzureDevOpsEnabled()) {
      return "🔧 **Status:** Azure DevOps integration is disabled";
    }
    
    if (!hasValidAzureDevOpsConfig()) {
      return "🔧 **Status:** Azure DevOps configuration is incomplete (missing PAT, Organization URL, or Project Name)";
    }
    
    if (teamMembers.length === 0) {
      return "🔧 **Status:** Azure DevOps is configured but no team members are added";
    }

    return `✅ **Status:** Azure DevOps is fully configured with ${teamMembers.length} team members`;
  };

  // Chat Handlers
  const handlers = useChatHandlers({
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    selectedRole: selectedRole as AIRole,
    setSelectedRole: setSelectedRole as React.Dispatch<React.SetStateAction<AIRole>>,
    language: language as Language,
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
    integrations: { settings, isAzureDevOpsEnabled, hasValidAzureDevOpsConfig }
  });

  // Navigation Handler
  const handleBackClick = () => {
    setMessages([]);
    setInputMessage('');
    setCurrentConversationId(null);
    setCurrentPanel('main');
  };

  // Backend Status Check
  React.useEffect(() => {
    const checkBackendStatus = async () => {
      if (selectedRole === 'product-manager') {
        try {
          const isConnected = await prdService.testConnection();
          if (!isConnected) {
            const warningMessage: Message = {
              id: `warning-${Date.now()}`,
              role: 'assistant',
              sender: 'ai',
              content: `⚠️ **Backend Server Status: Disconnected**\n\n🔧 **Action Required:**\nThe PRD generation service requires a backend server to be running.\n\n### 🚀 **To Start Backend:**\n1. Open terminal in your project directory\n2. Navigate to backend folder: \`cd backend\`\n3. Install dependencies: \`npm install\`\n4. Start server: \`npm run dev\`\n5. Look for: "Server running on http://localhost:8000"\n\n✅ Once the server is running, you can upload requirements files to generate PRD documents!`,
              timestamp: new Date(),
              aiRole: 'product-manager'
            };
            
            setMessages(prev => {
              const hasWarning = prev.some(msg => msg.id.startsWith('warning-'));
              return hasWarning ? prev : [...prev, warningMessage];
            });
          }
        } catch (error) {
          console.log('Backend status check failed:', error);
        }
      }
    };

    checkBackendStatus();
  }, [selectedRole, setMessages]);

  return (
    <ChatLayout
      messages={messages}
      inputMessage={inputMessage}
      selectedRole={selectedRole as AIRole}
      language={language as Language}
      isLoading={isLoading}
      currentPanel={currentPanel || 'chat'}
      conversations={conversations}
      currentConversationId={currentConversationId}
      messagesEndRef={messagesEndRef}
      onInputChange={setInputMessage}
      onRoleChange={setSelectedRole as (role: AIRole) => void}
      onLanguageChange={setLanguage as (lang: Language) => void}
      onPanelChange={setCurrentPanel || (() => {})}
      onExampleClick={handlers.handleExampleClick}
      onCreateNewConversation={handlers.handleCreateNewConversation}
      onSaveCurrentConversation={handlers.handleSaveCurrentConversation}
      onClearAllHistory={handlers.handleClearAllHistory}
      onLoadConversation={handlers.handleLoadConversation}
      onSendMessage={handlers.handleSendMessage}
      onKeyPress={handlers.handleKeyPress}
      onBackClick={handleBackClick}
      onFileUpload={handleFileUpload}
      setMessages={setMessages}
    />
  );
};

export default ChatInterface;
