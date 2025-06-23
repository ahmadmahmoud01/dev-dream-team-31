import React, { useState } from 'react';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAISettings } from '@/hooks/useAISettings';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useChatState } from '@/hooks/useChatState';
import { useChatHandlers } from '@/hooks/useChatHandlers';
import ChatLayout from './ChatLayout';
import { AIRole, Language, Message } from '@/types/chat';
import { prdService } from '@/services/prdService';
import { azureDevOpsService } from '@/services/azureDevOpsService';

// Enhanced Message type with interactive buttons
interface EnhancedMessage extends Message {
  buttons?: Array<{
    id: string;
    text: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
  }>;
}

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

  // AI and Integration Settings
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

  // ✅ ENHANCED: Conversational State Management
  const [conversationState, setConversationState] = useState<'initial' | 'awaiting_upload_decision' | 'awaiting_files' | 'prd_generated' | 'awaiting_task_decision' | 'tasks_created' | 'awaiting_test_decision' | 'tests_created' | 'completed'>('initial');
  const [generatedPRD, setGeneratedPRD] = useState<any>(null);

  // ✅ ENHANCED: Initialize Product Manager Conversation
  React.useEffect(() => {
    if (selectedRole === 'product-manager' && messages.length === 0) {
      initializeProductManagerChat();
    }
  }, [selectedRole]);

  const initializeProductManagerChat = () => {
    const welcomeMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `👋 **مرحباً! أنا مساعدك الذكي لإدارة المنتج**\n\n📋 **أنا هنا لمساعدتك في إنشاء مستند متطلبات المنتج (PRD) وإدارة المهام**\n\n🤔 **هل تريد تحميل ملفات متطلبات المشروع؟**`,
      timestamp: new Date(),
      aiRole: 'product-manager',
      buttons: [
        {
          id: 'upload_yes',
          text: 'نعم',
          action: 'upload_files_yes',
          variant: 'primary'
        },
        {
          id: 'upload_no',
          text: 'لا',
          action: 'upload_files_no',
          variant: 'secondary'
        }
      ]
    };

    setMessages([welcomeMessage]);
    setConversationState('awaiting_upload_decision');
  };

  // ✅ ENHANCED: Handle Button Interactions
  const handleButtonClick = async (action: string) => {
    console.log('Button clicked:', action, 'Current state:', conversationState);
    
    switch (action) {
      case 'upload_files_yes':
        handleUploadFilesYes();
        break;
      case 'upload_files_no':
        handleUploadFilesNo();
        break;
      case 'create_tasks_yes':
        await handleCreateTasksYes();
        break;
      case 'create_tasks_no':
        handleCreateTasksNo();
        break;
      case 'generate_tests_yes':
        await handleGenerateTestsYes();
        break;
      case 'generate_tests_no':
        handleGenerateTestsNo();
        break;
      case 'start_new_flow':
        handleStartNewFlow();
        break;
      default:
        console.warn('Unknown button action:', action);
    }
  };

  // ✅ NEW: Handle Upload Files Yes
  const handleUploadFilesYes = () => {
    const uploadPromptMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `✅ **ممتاز! الآن يرجى تحميل الملفات**\n\n📁 **الملفات المدعومة:**\n• مستندات Word (.doc, .docx)\n• ملفات PDF (.pdf)\n• ملفات نصية (.txt)\n• حد أقصى 5 ملفات\n\n📤 **استخدم زر التحميل أعلاه لتحميل ملفات متطلبات المشروع**`,
      timestamp: new Date(),
      aiRole: 'product-manager'
    };

    setMessages(prev => [...prev, uploadPromptMessage]);
    setConversationState('awaiting_files');
  };

  // ✅ NEW: Handle Upload Files No
  const handleUploadFilesNo = () => {
    const noUploadMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `📝 **لا بأس!**\n\nيمكنك العودة في أي وقت عندما تكون جاهزاً لتحميل ملفات متطلبات المشروع.\n\n🔄 **هل تريد البدء من جديد؟**`,
      timestamp: new Date(),
      aiRole: 'product-manager',
      buttons: [
        {
          id: 'start_new',
          text: 'بدء جديد',
          action: 'start_new_flow',
          variant: 'primary'
        }
      ]
    };

    setMessages(prev => [...prev, noUploadMessage]);
    setConversationState('completed');
  };

  // ✅ ENHANCED: File Upload Handler
  const handleFileUpload = async (files: File[]) => {
    if (selectedRole === 'product-manager' && conversationState === 'awaiting_files') {
      await handleProductManagerFileUpload(files);
    } else if (selectedRole === 'project-manager') {
      await handleProjectManagerUpload(files);
    } else {
      console.log('File upload not allowed for current role/state:', selectedRole, conversationState);
      return;
    }
  };

  // ✅ ENHANCED: Product Manager File Upload
  const handleProductManagerFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    console.log(`=== PRODUCT MANAGER FILE UPLOAD ===`);
    console.log('Files:', files.map(f => f.name));

    // Show processing message
    const processingMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'user',
      sender: 'user',
      content: `📁 **تم تحميل ${files.length} ملفات:**\n\n${files.map(file => `• ${file.name} (${(file.size / 1024).toFixed(2)} KB)`).join('\n')}\n\n🔄 **جاري تحليل الملفات وإنشاء مستند PRD...**`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, processingMessage]);
    setIsLoading(true);

    try {
      // Test backend connection
      const isBackendConnected = await prdService.testConnection();
      
      if (!isBackendConnected) {
        throw new Error('خادم النظام غير متصل. يرجى التأكد من تشغيل خادم Node.js على المنفذ 8000.');
      }

      // Generate PRD
      const result = await prdService.generatePRDFromMultipleFiles(files);

      if (result.success) {
        setGeneratedPRD(result);
        setConversationState('prd_generated');

        // Show success and ask about task creation
        const successMessage: EnhancedMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: `✅ **تم إنشاء مستند PRD بنجاح!**\n\n📄 **الملف المُنشأ:** PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx\n\n📊 **إحصائيات:**\n• عدد الملفات: ${files.length}\n• تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}\n• الحالة: مكتمل\n\n🎉 **تم تحميل المستند تلقائياً!**\n\n🤔 **هل تريد إنشاء المهام لهذا المستند وتعيينها للموظفين مع الوقت المقدر؟**`,
          timestamp: new Date(),
          aiRole: 'product-manager',
          buttons: [
            {
              id: 'create_tasks_yes',
              text: 'نعم',
              action: 'create_tasks_yes',
              variant: 'primary'
            },
            {
              id: 'create_tasks_no',
              text: 'لا',
              action: 'create_tasks_no',
              variant: 'secondary'
            }
          ]
        };

        setMessages(prev => [...prev, successMessage]);

      } else {
        throw new Error(result.error || 'فشل في إنشاء مستند PRD');
      }
    } catch (error: any) {
      console.error('Error in PRD generation:', error);
      
      const errorMessage: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        sender: 'ai',
        content: `❌ **خطأ في إنشاء مستند PRD**\n\n🚫 **الخطأ:** ${error.message}\n\n🔄 **هل تريد المحاولة مرة أخرى؟**`,
        timestamp: new Date(),
        aiRole: 'product-manager',
        buttons: [
          {
            id: 'start_new',
            text: 'بدء جديد',
            action: 'start_new_flow',
            variant: 'primary'
          }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationState('completed');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Handle Create Tasks Yes
  const handleCreateTasksYes = async () => {
    const processingMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `🔄 **جاري إنشاء المهام في Azure DevOps...**\n\n📋 **العمليات الجارية:**\n• تحليل مستند PRD\n• إنشاء المهام للمطورين\n• تعيين الأوقات المقدرة\n• تعيين المهام للموظفين\n\nيرجى الانتظار...`,
      timestamp: new Date(),
      aiRole: 'product-manager'
    };

    setMessages(prev => [...prev, processingMessage]);
    setIsLoading(true);

    try {
      const azureDevOpsConfig = settings.devops;
      const teamMembers = azureDevOpsConfig?.teamMembers || [];
      
      if (!isAzureDevOpsEnabled() || !hasValidAzureDevOpsConfig()) {
        throw new Error('Azure DevOps غير مكوّن بشكل صحيح. يرجى تكوينه في لوحة التكاملات أولاً.');
      }

      const developers = teamMembers.filter(member => 
        ['frontend', 'backend', 'fullstack', 'devops'].includes(member.role)
      );

      if (developers.length === 0) {
        throw new Error('لا توجد مطورين مكوّنين في إعدادات Azure DevOps.');
      }

      // Create development tasks
      const taskResult = await azureDevOpsService.createTasksFromPRD(
        {
          personalAccessToken: azureDevOpsConfig.personalAccessToken,
          organizationUrl: azureDevOpsConfig.organizationUrl,
          projectName: azureDevOpsConfig.projectName
        },
        `PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx`,
        developers.map(member => ({
          email: member.email,
          role: member.role
        }))
      );

      if (taskResult.success) {
        setConversationState('tasks_created');

        const successMessage: EnhancedMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: `✅ **تم إنشاء المهام بنجاح!**\n\n🎯 **المهام المُنشأة:** ${taskResult.createdTasks?.length || 0}\n📋 **المشروع:** ${azureDevOpsConfig?.projectName}\n\n### 📝 **تفاصيل المهام:**\n\n${taskResult.createdTasks?.map((task: any, index: number) => 
            `**مهمة #${task.workItemId}** - ${task.email} (${task.role}) - ${task.estimatedHours || 'غير محدد'}h\n`
          ).join('') || ''}\n\n🤔 **هل تريد إنشاء حالات اختبار من مستند PRD وتعيينها لمختبر؟**`,
          timestamp: new Date(),
          aiRole: 'product-manager',
          buttons: [
            {
              id: 'generate_tests_yes',
              text: 'نعم',
              action: 'generate_tests_yes',
              variant: 'primary'
            },
            {
              id: 'generate_tests_no',
              text: 'لا',
              action: 'generate_tests_no',
              variant: 'secondary'
            }
          ]
        };

        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(taskResult.error || 'فشل في إنشاء المهام');
      }
    } catch (error: any) {
      console.error('Error creating tasks:', error);
      
      const errorMessage: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        sender: 'ai',
        content: `❌ **خطأ في إنشاء المهام**\n\n🚫 **الخطأ:** ${error.message}\n\n🔄 **هل تريد البدء من جديد؟**`,
        timestamp: new Date(),
        aiRole: 'product-manager',
        buttons: [
          {
            id: 'start_new',
            text: 'بدء جديد',
            action: 'start_new_flow',
            variant: 'primary'
          }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationState('completed');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Handle Create Tasks No
  const handleCreateTasksNo = () => {
    const noTasksMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `📝 **تم إنشاء مستند PRD بنجاح وتحميله!**\n\nيمكنك إنشاء المهام لاحقاً عند الحاجة.\n\n🤔 **هل تريد إنشاء حالات اختبار من مستند PRD وتعيينها لمختبر؟**`,
      timestamp: new Date(),
      aiRole: 'product-manager',
      buttons: [
        {
          id: 'generate_tests_yes',
          text: 'نعم',
          action: 'generate_tests_yes',
          variant: 'primary'
        },
        {
          id: 'generate_tests_no',
          text: 'لا',
          action: 'generate_tests_no',
          variant: 'secondary'
        }
      ]
    };

    setMessages(prev => [...prev, noTasksMessage]);
    setConversationState('tasks_created'); // Move to next step
  };

  // ✅ NEW: Handle Generate Tests Yes
  const handleGenerateTestsYes = async () => {
    const processingMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `🔄 **جاري إنشاء حالات الاختبار...**\n\n🧪 **العمليات الجارية:**\n• تحليل مستند PRD لحالات الاختبار\n• إنشاء حالات اختبار شاملة\n• تعيين الأوقات المقدرة\n• تعيين الحالات للمختبرين\n\nيرجى الانتظار...`,
      timestamp: new Date(),
      aiRole: 'product-manager'
    };

    setMessages(prev => [...prev, processingMessage]);
    setIsLoading(true);

    try {
      const azureDevOpsConfig = settings.devops;
      const teamMembers = azureDevOpsConfig?.teamMembers || [];
      const testers = teamMembers.filter(member => member.role === 'tester');

      if (testers.length === 0) {
        throw new Error('لا توجد مختبرين مكوّنين في إعدادات Azure DevOps.');
      }

      const prdSummary = `مستند PRD تم إنشاؤه من ملفات المتطلبات. يحتوي على نظرة عامة على المنتج وقصص المستخدمين والمتطلبات التقنية ومواصفات الميزات.`;

      const testCaseResult = await azureDevOpsService.generateTestCasesFromPRD(
        {
          personalAccessToken: azureDevOpsConfig.personalAccessToken,
          organizationUrl: azureDevOpsConfig.organizationUrl,
          projectName: azureDevOpsConfig.projectName
        },
        `PRD_ChunkedProcessing_${new Date().toISOString().split('T')[0]}.docx`,
        prdSummary,
        testers.map(member => ({
          email: member.email,
          role: member.role
        }))
      );

      if (testCaseResult.success) {
        setConversationState('tests_created');

        const successMessage: EnhancedMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: `✅ **تم إنشاء حالات الاختبار بنجاح!**\n\n🧪 **حالات الاختبار:** ${testCaseResult.createdTestCases?.length || 0}\n👨‍💻 **المختبرين:** ${testers.length}\n📋 **المشروع:** ${azureDevOpsConfig?.projectName}\n\n### 🔍 **تفاصيل حالات الاختبار:**\n\n${testCaseResult.createdTestCases?.map((testCase: any, index: number) => 
            `**حالة اختبار #${testCase.workItemId}** - ${testCase.email}\n`
          ).join('') || ''}\n\n🎉 **تم إكمال العملية بنجاح!**\n\n### 📊 **ملخص ما تم إنجازه:**\n• ✅ إنشاء مستند PRD\n• ✅ ${conversationState === 'tasks_created' ? 'إنشاء مهام التطوير' : 'تخطي مهام التطوير'}\n• ✅ إنشاء حالات الاختبار\n\n🔄 **هل تريد بدء عملية جديدة؟**`,
          timestamp: new Date(),
          aiRole: 'product-manager',
          buttons: [
            {
              id: 'start_new',
              text: 'بدء عملية جديدة',
              action: 'start_new_flow',
              variant: 'primary'
            }
          ]
        };

        setMessages(prev => [...prev, successMessage]);
        setConversationState('completed');
      } else {
        throw new Error(testCaseResult.error || 'فشل في إنشاء حالات الاختبار');
      }
    } catch (error: any) {
      console.error('Error generating test cases:', error);
      
      const errorMessage: EnhancedMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        sender: 'ai',
        content: `❌ **خطأ في إنشاء حالات الاختبار**\n\n🚫 **الخطأ:** ${error.message}\n\n🔄 **هل تريد البدء من جديد؟**`,
        timestamp: new Date(),
        aiRole: 'product-manager',
        buttons: [
          {
            id: 'start_new',
            text: 'بدء جديد',
            action: 'start_new_flow',
            variant: 'primary'
          }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationState('completed');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Handle Generate Tests No
  const handleGenerateTestsNo = () => {
    const completionMessage: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      sender: 'ai',
      content: `🎉 **تم إكمال العملية بنجاح!**\n\n### 📊 **ملخص ما تم إنجازه:**\n• ✅ إنشاء مستند PRD\n• ✅ ${conversationState === 'tasks_created' ? 'إنشاء مهام التطوير' : 'تخطي مهام التطوير'}\n• ⏭️ تخطي حالات الاختبار\n\nيمكنك إنشاء حالات الاختبار لاحقاً عند الحاجة.\n\n🔄 **هل تريد بدء عملية جديدة؟**`,
      timestamp: new Date(),
      aiRole: 'product-manager',
      buttons: [
        {
          id: 'start_new',
          text: 'بدء عملية جديدة',
          action: 'start_new_flow',
          variant: 'primary'
        }
      ]
    };

    setMessages(prev => [...prev, completionMessage]);
    setConversationState('completed');
  };

  // ✅ NEW: Handle Start New Flow
  const handleStartNewFlow = () => {
    setConversationState('initial');
    setGeneratedPRD(null);
    setMessages([]);
    initializeProductManagerChat();
  };

  // Keep existing PROJECT MANAGER upload handler unchanged
  const handleProjectManagerUpload = async (files: File[]) => {
    console.log('=== PROJECT MANAGER PRD UPLOAD ===');
    
    const azureDevOpsConfig = settings.devops;
    const teamMembers = azureDevOpsConfig?.teamMembers || [];
    const testers = teamMembers.filter(member => member.role === 'tester');

    // Add user message showing file upload
    const fileList = files.map(file => `• ${file.name} (${(file.size / 1024).toFixed(2)} KB)`).join('\n');
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      sender: 'user',
      content: `📄 **Uploading PRD document for test case generation:**\n\n${fileList}\n\n📄 **Total size:** ${(totalSize / 1024).toFixed(2)} KB\n\n🧪 **Status:** Analyzing PRD and generating comprehensive test cases...\n\nPlease wait while I create test cases and assign them to testers in Azure DevOps.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, uploadMessage]);
    setIsLoading(true);

    // Validate Azure DevOps configuration
    if (!isAzureDevOpsEnabled() || !hasValidAzureDevOpsConfig()) {
      throw new Error('Azure DevOps is not properly configured. Please configure it in the Integrations panel first.');
    }

    if (testers.length === 0) {
      throw new Error('No testers found in your Azure DevOps configuration. Please add team members with tester role in the Integrations panel.');
    }

    // Read PRD file content
    const prdFile = files[0]; // Project Manager uploads single PRD file
    const prdContent = await readFileContent(prdFile);
    
    console.log('PRD file content length:', prdContent.length);
    console.log('Testers configured:', testers.length);

    try {
      // Generate test cases from PRD
      const testCaseResult = await azureDevOpsService.generateTestCasesFromPRD(
        {
          personalAccessToken: azureDevOpsConfig.personalAccessToken,
          organizationUrl: azureDevOpsConfig.organizationUrl,
          projectName: azureDevOpsConfig.projectName
        },
        prdFile.name,
        prdContent.substring(0, 8000), // Limit content for API
        testers.map(member => ({
          email: member.email,
          role: member.role
        }))
      );

      if (testCaseResult.success) {
        const successContent = `✅ **Test Cases Generated Successfully from PRD!**\n\n📄 **PRD File:** ${prdFile.name}\n🧪 **Test Cases Created:** ${testCaseResult.createdTestCases?.length || 0}\n👨‍💻 **Assigned to Testers:** ${testers.length}\n📋 **Azure DevOps Project:** ${azureDevOpsConfig?.projectName}\n📅 **Generated:** ${new Date().toLocaleDateString()}\n\n---\n\n### 🔍 **Test Case Work Items:**\n\n${testCaseResult.createdTestCases?.map((testCase: any, index: number) => 
          `**Test Case #${testCase.workItemId}** - ${testCase.email}\n`
        ).join('') || ''}\n\n### 📋 **Test Coverage Includes:**\n\n• **Functional Testing** - Core feature validation and business logic verification\n• **User Interface Testing** - UI component testing and user experience validation\n• **Integration Testing** - API testing and system component integration\n• **Error Handling Testing** - Negative scenarios and edge case validation\n• **Performance Testing** - Load testing and response time verification\n• **Security Testing** - Access control and data protection validation\n• **Compatibility Testing** - Cross-browser and device compatibility\n• **User Acceptance Testing** - End-to-end workflow validation\n\n---\n\n🎉 **All test cases have been created and assigned to testers in Azure DevOps!**\n\n### 🔗 **Next Steps:**\n\n• **Testers:** Check Azure DevOps for assigned test cases\n• **Project Manager:** Monitor test execution progress through Azure DevOps dashboard\n• **Team:** Use work item IDs to track specific test cases\n• **Quality Assurance:** Execute test cases as development progresses`;

        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          sender: 'ai',
          content: successContent,
          timestamp: new Date(),
          aiRole: 'project-manager'
        };

        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(testCaseResult.error || 'Failed to generate test cases from PRD');
      }
    } catch (error) {
      console.error('Test case generation error:', error);
      throw new Error(`Test case generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep existing repository linking handler unchanged
  const handleRepoLink = async (organizationUrl: string, projectName: string, repositoryName: string, personalAccessToken: string) => {
    if (selectedRole !== 'backend') {
      console.log('Repository linking only available for Backend Developer');
      return;
    }

    console.log('=== AZURE DEVOPS REPOSITORY CREATION ===');
    console.log('Organization URL:', organizationUrl);
    console.log('Project Name:', projectName);
    console.log('Repository Name:', repositoryName);
    console.log('Token provided:', !!personalAccessToken);

    const linkMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      sender: 'user',
      content: `🔗 **Creating Azure DevOps Repository**\n\n🏢 **Organization:** ${organizationUrl}\n📋 **Project:** ${projectName}\n📁 **Repository:** ${repositoryName}\n🔑 **Token:** ${personalAccessToken.substring(0, 8)}...\n\n🔄 **Status:** Creating repository and Node.js project with authentication...\n\nPlease wait while I set up your complete development environment in Azure DevOps.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, linkMessage]);
    setIsLoading(true);

    try {
      // Call backend API to create Azure DevOps repository and project
      const response = await fetch('http://localhost:8000/api/azure-devops/create-nodejs-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationUrl,
          projectName,
          repositoryName,
          personalAccessToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create project`);
      }

      const result = await response.json();

      if (result.success) {
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          sender: 'ai',
          content: `✅ **Azure DevOps Repository and Node.js Project Created Successfully!**\n\n🎉 **Repository:** ${result.repositoryUrl}\n📝 **Repository ID:** ${result.repositoryId}\n💾 **Commit ID:** ${result.commitId}\n📦 **Project:** ${projectName}/${repositoryName}\n\n---\n\n### 🚀 **Project Features Created:**\n\n• **Express.js Server** - Modern web framework with middleware\n• **User Authentication** - Complete login/register system with JWT\n• **MongoDB Integration** - Database connectivity with Mongoose\n• **Security Middleware** - Helmet, CORS, Rate limiting\n• **Input Validation** - Request validation with express-validator\n• **Error Handling** - Comprehensive error management\n• **Environment Configuration** - .env setup for different environments\n• **RESTful API Design** - Well-structured API endpoints\n\n### 📁 **Project Structure Created:**\n\n\`\`\`\n├── server.js              # Main server file\n├── package.json           # Dependencies and scripts\n├── routes/\n│   ├── auth.js           # Authentication routes\n│   └── users.js          # User management routes\n├── models/\n│   └── User.js           # User model with Mongoose\n├── middleware/\n│   └── auth.js           # JWT authentication middleware\n├── .env.example          # Environment variables template\n└── .gitignore            # Git ignore rules\n\`\`\`\n\n### 🔗 **API Endpoints Available:**\n\n• \`POST /api/auth/register\` - User registration\n• \`POST /api/auth/login\` - User login\n• \`GET /api/auth/me\` - Get current user (protected)\n• \`GET /api/users/profile\` - Get user profile (protected)\n• \`PUT /api/users/profile\` - Update user profile (protected)\n• \`GET /api/health\` - Server health check\n\n### 🛠️ **Next Steps:**\n\n1. **Clone the repository:**\n   \`\`\`bash\n   git clone ${result.repositoryUrl}\n   cd ${repositoryName}\n   \`\`\`\n\n2. **Install dependencies:**\n   \`\`\`bash\n   npm install\n   \`\`\`\n\n3. **Set up environment:**\n   \`\`\`bash\n   cp .env.example .env\n   # Edit .env with your MongoDB URI and JWT secret\n   \`\`\`\n\n4. **Start development server:**\n   \`\`\`bash\n   npm run dev\n   \`\`\`\n\n5. **Set up Azure DevOps Pipeline:**\n   - Navigate to Pipelines in your Azure DevOps project\n   - Create new pipeline from your repository\n   - Use the included azure-pipelines.yml for CI/CD\n\n---\n\n🎊 **Your Node.js project with authentication is ready in Azure DevOps!**\n\n### 🔐 **Security Features Included:**\n\n• **Password Hashing** with bcryptjs\n• **JWT Token Authentication** with expiration\n• **Input Validation** for all endpoints\n• **Rate Limiting** to prevent abuse\n• **CORS Protection** for cross-origin requests\n• **Helmet Security** headers\n\n### 📚 **Azure DevOps Integration:**\n\nYour repository is now available in Azure DevOps with:\n• **Version Control** - Full Git repository with history\n• **Pull Requests** - Code review workflow\n• **Work Items** - Integration with existing Azure DevOps tasks\n• **CI/CD Ready** - Pipeline configuration included\n• **Team Collaboration** - Shared development environment\n\n### 🎯 **Ready for Development:**\n\nYour repository now contains a production-ready Node.js application with authentication. The project is fully integrated with your Azure DevOps environment and ready for team collaboration!`,
          timestamp: new Date(),
          aiRole: 'backend'
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(result.error || 'Failed to create Azure DevOps project');
      }

    } catch (error: any) {
      console.error('Error creating Azure DevOps repository:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        sender: 'ai',
        content: `❌ **Azure DevOps Repository Creation Failed**\n\n🚫 **Error:** ${error.message}\n\n### 🔧 **Troubleshooting Steps:**\n\n1. **Check Organization URL** - Ensure format: \`https://dev.azure.com/organization\`\n2. **Verify Project Name** - Make sure the project exists in your organization\n3. **Check Repository Name** - Ensure it's unique within the project\n4. **Verify Personal Access Token** - Token must have Code (read & write) permissions\n5. **Check Permissions** - Ensure you have contributor access to the project\n6. **Backend Server** - Verify your Node.js backend is running on port 8000\n\n### 💡 **Required Azure DevOps Token Permissions:**\n• **Code (read & write)** - Create and manage repositories\n• **Project and Team (read)** - Access project information\n• **Build (read & execute)** - For CI/CD pipeline setup\n\n### 🔗 **How to Create Azure DevOps Token:**\n1. Go to Azure DevOps → User Settings → Personal Access Tokens\n2. Create new token with Code (read & write) scope\n3. Copy the token and use it here\n\n### 📋 **Common Issues:**\n• **Project doesn't exist** - Create the project first in Azure DevOps\n• **Repository name conflict** - Choose a different repository name\n• **Insufficient permissions** - Contact your Azure DevOps administrator\n• **Token expired** - Generate a new Personal Access Token\n\n**Ready to try again?** Check your settings and create repository again.`,
        timestamp: new Date(),
        aiRole: 'backend'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error('Failed to read file content'));
      };
      reader.readAsText(file);
    });
  };

  // Helper function to check Azure DevOps configuration status
  const getAzureDevOpsConfigStatus = () => {
    const azureDevOpsConfig = settings.devops;
    const teamMembers = azureDevOpsConfig?.teamMembers || [];
    const developers = teamMembers.filter(member => 
      ['frontend', 'backend', 'fullstack', 'devops'].includes(member.role)
    );
    const testers = teamMembers.filter(member => member.role === 'tester');

    if (!isAzureDevOpsEnabled()) {
      return "🔧 **Status:** Azure DevOps integration is disabled";
    }
    
    if (!hasValidAzureDevOpsConfig()) {
      return "🔧 **Status:** Azure DevOps configuration is incomplete (missing PAT, Organization URL, or Project Name)";
    }
    
    if (teamMembers.length === 0) {
      return "🔧 **Status:** Azure DevOps is configured but no team members are added";
    }

    return `✅ **Status:** Azure DevOps is fully configured with ${teamMembers.length} team members (${developers.length} developers, ${testers.length} testers)`;
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

  // Enhanced Backend Status Check for Multiple Roles
  React.useEffect(() => {
    const checkBackendStatus = async () => {
      if (['product-manager', 'project-manager', 'backend'].includes(selectedRole)) {
        try {
          const isConnected = await prdService.testConnection();
          if (!isConnected) {
            const warningMessage: Message = {
              id: `warning-${Date.now()}`,
              role: 'assistant',
              sender: 'ai',
              content: `⚠️ **Backend Server Status: Disconnected**\n\n🔧 **Action Required:**\nThe ${selectedRole === 'backend' ? 'Azure DevOps repository integration' : 'file processing'} service requires a backend server to be running.\n\n### 🚀 **To Start Backend:**\n1. Open terminal in your project directory\n2. Navigate to backend folder: \`cd backend\`\n3. Install dependencies: \`npm install\`\n4. Start server: \`npm run dev\`\n5. Look for: "Server running on http://localhost:8000"\n\n✅ Once the server is running, you can ${selectedRole === 'backend' ? 'create Azure DevOps repositories' : 'upload files for processing'}!`,
              timestamp: new Date(),
              aiRole: selectedRole
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
      onRepoLink={handleRepoLink}
      onButtonClick={handleButtonClick}
      conversationState={conversationState}
    />
  );
};

export default ChatInterface;
