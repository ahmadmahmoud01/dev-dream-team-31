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
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
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
  onRepoLink?: (organizationUrl: string, projectName: string, repositoryName: string, personalAccessToken: string) => void;
  onButtonClick?: (action: string) => void;
  conversationState?: 'initial' | 'awaiting_upload_decision' | 'awaiting_files' | 'prd_generated' | 'awaiting_task_decision' | 'tasks_created' | 'awaiting_test_decision' | 'tests_created' | 'completed'; // ✅ ENHANCED: Extended states
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
  setMessages,
  onExampleClick,
  onCreateNewConversation,
  onSaveCurrentConversation,
  onClearAllHistory,
  onLoadConversation,
  onSendMessage,
  onKeyPress,
  onBackClick,
  onFileUpload,
  onRepoLink,
  onButtonClick,
  conversationState
}) => {
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const isDynamicRole = currentRole?.isDynamic || false;

  // ✅ NEW: Determine if file upload should be enabled based on conversation state
  const shouldShowFileUpload = () => {
    if (selectedRole === 'product-manager') {
      return conversationState === 'awaiting_files';
    }
    if (selectedRole === 'project-manager') {
      return true; // Project Manager can always upload PRD files
    }
    return false;
  };

  // ✅ NEW: Determine if repository linking should be enabled
  const shouldShowRepoLink = () => {
    return selectedRole === 'backend';
  };

  // ✅ NEW: Get conversation state indicator
  const getConversationStateIndicator = () => {
    if (selectedRole !== 'product-manager' || !conversationState) return null;

    const stateLabels = {
      'initial': language === 'ar' ? 'بداية المحادثة' : 'Starting conversation',
      'awaiting_upload_decision': language === 'ar' ? 'في انتظار قرار التحميل' : 'Awaiting upload decision',
      'awaiting_files': language === 'ar' ? 'في انتظار تحميل الملفات' : 'Awaiting file upload',
      'prd_generated': language === 'ar' ? 'تم إنشاء مستند PRD' : 'PRD generated',
      'awaiting_task_decision': language === 'ar' ? 'في انتظار قرار إنشاء المهام' : 'Awaiting task decision',
      'tasks_created': language === 'ar' ? 'تم إنشاء المهام' : 'Tasks created',
      'awaiting_test_decision': language === 'ar' ? 'في انتظار قرار إنشاء الاختبارات' : 'Awaiting test decision',
      'tests_created': language === 'ar' ? 'تم إنشاء الاختبارات' : 'Tests created',
      'completed': language === 'ar' ? 'اكتملت العملية' : 'Process completed'
    };

    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-4 rounded">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-sm text-blue-700 font-medium">
            {language === 'ar' ? 'حالة المحادثة:' : 'Conversation State:'} {stateLabels[conversationState]}
          </span>
        </div>
      </div>
    );
  };

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
            {/* ✅ NEW: Conversation State Indicator */}
            {getConversationStateIndicator()}
            
            <ChatMainContent
              currentPanel={currentPanel}
              messages={messages}
              selectedRole={selectedRole}
              language={language}
              isLoading={isLoading}
              onExampleClick={onExampleClick}
              messagesEndRef={messagesEndRef}
              setMessages={setMessages}
              onButtonClick={onButtonClick}
              conversationState={conversationState}
            />
          </div>
        </div>

        {/* ✅ ENHANCED: Conditional Chat Input based on conversation state */}
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
            onFileUpload={shouldShowFileUpload() ? onFileUpload : undefined} // ✅ Conditional file upload
            onRepoLink={shouldShowRepoLink() ? onRepoLink : undefined} // ✅ Conditional repo linking
            conversationState={conversationState} // ✅ Pass conversation state
          />
        )}

        {/* ✅ NEW: Conversation Flow Helper */}
        {selectedRole === 'product-manager' && conversationState === 'awaiting_files' && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-bounce"></div>
                <span className="text-sm font-medium">
                  {language === 'ar' 
                    ? '📁 يرجى استخدام زر التحميل أعلاه لتحميل ملفات متطلبات المشروع'
                    : '📁 Please use the upload button above to upload your project requirements files'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: Process Completion Indicator */}
        {selectedRole === 'product-manager' && conversationState === 'completed' && (
          <div className="bg-green-50 border-t border-green-200 p-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">
                  {language === 'ar' 
                    ? '✅ تم إكمال العملية بنجاح! يمكنك بدء عملية جديدة في أي وقت'
                    : '✅ Process completed successfully! You can start a new process anytime'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
