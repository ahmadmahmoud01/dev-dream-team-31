import React, { useRef, useState } from 'react';
import { Send, Upload, Mic, MicOff, GitBranch, X, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import QuickRepositoryAccess from './QuickRepositoryAccess';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  selectedRole: AIRole;
  language: Language;
  isLoading: boolean;
  isDynamicRole?: boolean;
  onFileUpload?: (files: File[]) => void;
  onRepoLink?: (organizationUrl: string, projectName: string, repositoryName: string, personalAccessToken: string) => void;
  conversationState?: 'initial' | 'awaiting_upload_decision' | 'awaiting_files' | 'prd_generated' | 'awaiting_task_decision' | 'tasks_created' | 'awaiting_test_decision' | 'tests_created' | 'completed'; // ✅ NEW: Conversation state
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onKeyPress,
  selectedRole,
  language,
  isLoading,
  isDynamicRole,
  onFileUpload,
  onRepoLink,
  conversationState, // ✅ NEW: Conversation state
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showAzureRepoDialog, setShowAzureRepoDialog] = useState(false);
  const [azureOrgUrl, setAzureOrgUrl] = useState('');
  const [azureProjectName, setAzureProjectName] = useState('');
  const [azureRepoName, setAzureRepoName] = useState('');
  const [azurePat, setAzurePat] = useState('');
  
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecording();

  // ✅ ENHANCED: Check if current role can upload files based on conversation state
  const canUploadFiles = () => {
    if (selectedRole === 'product-manager') {
      // Product Manager can only upload files when conversation state allows it
      return conversationState === 'awaiting_files';
    }
    if (selectedRole === 'project-manager') {
      return true; // Project Manager can always upload PRD files
    }
    return false;
  };

  // Check if current role can link repositories
  const canLinkRepository = () => {
    return selectedRole === 'backend';
  };

  // ✅ ENHANCED: Get role-specific upload guidance based on conversation state
  const getUploadGuidance = () => {
    switch (selectedRole) {
      case 'product-manager':
        if (conversationState === 'awaiting_files') {
          return {
            title: language === 'ar' ? 'تحميل متطلبات المشروع' : 'Upload Project Requirements',
            description: language === 'ar' ? 'حدد ملفات المتطلبات (حد أقصى 5)' : 'Select requirements files (max 5)',
            acceptedTypes: '.txt,.doc,.docx,.pdf',
            placeholder: language === 'ar' ? 'قم بتحميل ملفات المتطلبات الآن...' : 'Upload requirements files now...'
          };
        } else {
          return {
            title: language === 'ar' ? 'تحميل متطلبات المشروع' : 'Upload Project Requirements',
            description: language === 'ar' ? 'استخدم الأزرار أعلاه للتفاعل' : 'Use buttons above to interact',
            acceptedTypes: '.txt,.doc,.docx,.pdf',
            placeholder: language === 'ar' ? 'استخدم الأزرار التفاعلية أعلاه...' : 'Use interactive buttons above...'
          };
        }
      case 'project-manager':
        return {
          title: language === 'ar' ? 'تحميل مستند PRD' : 'Upload PRD Document',
          description: language === 'ar' ? 'حدد مستند PRD لإنشاء حالات الاختبار' : 'Select PRD document to create test cases',
          acceptedTypes: '.docx,.doc,.pdf',
          placeholder: language === 'ar' ? 'قم بتحميل مستند PRD أو اكتب رسالتك...' : 'Upload PRD document or type your message...'
        };
      case 'backend':
        return {
          title: language === 'ar' ? 'ربط مستودع Azure DevOps' : 'Link Azure DevOps Repository',
          description: language === 'ar' ? 'اربط مستودع Azure DevOps لإنشاء مشروع Node.js' : 'Link Azure DevOps repository to create Node.js project',
          acceptedTypes: '',
          placeholder: language === 'ar' ? 'اربط مستودع Azure DevOps أو اكتب رسالتك...' : 'Link Azure DevOps repository or type your message...'
        };
      default:
        return {
          title: language === 'ar' ? 'رفع ملفات' : 'Upload Files',
          description: language === 'ar' ? 'تحميل الملفات غير متاح لهذا الدور' : 'File upload not available for this role',
          acceptedTypes: '',
          placeholder: `${t.placeholder} ${currentRole.name}...`
        };
    }
  };

  // Handle Azure DevOps repository linking
  const handleRepoLink = () => {
    if (!canLinkRepository()) {
      alert(language === 'ar' 
        ? `ربط المستودع متاح فقط لمطور الخلفية. الدور الحالي: ${currentRole.name}` 
        : `Repository linking is only available for Backend Developer. Current role: ${currentRole.name}`);
      return;
    }
    setShowAzureRepoDialog(true);
  };

  const handleAzureRepoSubmit = () => {
    if (azureOrgUrl.trim() && azureProjectName.trim() && azureRepoName.trim() && azurePat.trim() && onRepoLink) {
      // Validate Azure DevOps URL format
      const azureUrlPattern = /^https:\/\/dev\.azure\.com\/[^\/]+\/?$/;
      if (!azureUrlPattern.test(azureOrgUrl.trim())) {
        alert(language === 'ar' 
          ? 'يرجى إدخال رابط Azure DevOps صحيح بالصيغة: https://dev.azure.com/organization'
          : 'Please enter a valid Azure DevOps URL in format: https://dev.azure.com/organization');
        return;
      }

      // Validate repository name
      if (azureRepoName.trim().length < 1) {
        alert(language === 'ar' 
          ? 'يرجى إدخال اسم مستودع صحيح'
          : 'Please enter a valid repository name');
        return;
      }

      onRepoLink(azureOrgUrl.trim(), azureProjectName.trim(), azureRepoName.trim(), azurePat.trim());
      setAzureOrgUrl('');
      setAzureProjectName('');
      setAzureRepoName('');
      setAzurePat('');
      setShowAzureRepoDialog(false);
    }
  };

  // ✅ ENHANCED: Handle file upload with conversation state awareness
  const handleFileUpload = () => {
    if (!canUploadFiles()) {
      if (selectedRole === 'product-manager') {
        alert(language === 'ar' 
          ? 'يرجى استخدام الأزرار التفاعلية أعلاه للتفاعل مع النظام'
          : 'Please use the interactive buttons above to interact with the system');
      } else {
        alert(language === 'ar' 
          ? `تحميل الملفات متاح فقط لمدير المنتج ومدير المشروع. الدور الحالي: ${currentRole.name}` 
          : `File upload is only available for Product Manager and Project Manager. Current role: ${currentRole.name}`);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }

    // Check if role can upload files
    if (!canUploadFiles()) {
      if (selectedRole === 'product-manager') {
        alert(language === 'ar' 
          ? 'يرجى استخدام الأزرار التفاعلية أعلاه للتفاعل مع النظام'
          : 'Please use the interactive buttons above to interact with the system');
      } else {
        alert(language === 'ar' 
          ? `تحميل الملفات متاح فقط لمدير المنتج ومدير المشروع. الدور الحالي: ${currentRole.name}` 
          : `File upload is only available for Product Manager and Project Manager. Current role: ${currentRole.name}`);
      }
      return;
    }

    // Role-specific file validation
    let allowedTypes: string[] = [];
    let maxFiles = 5;
    let fileTypeDescription = '';

    if (selectedRole === 'product-manager') {
      // Product Manager: Requirements files
      allowedTypes = [
        'text/plain', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/pdf'
      ];
      maxFiles = 5;
      fileTypeDescription = language === 'ar' 
        ? 'ملفات المتطلبات (txt, doc, docx, pdf)' 
        : 'Requirements files (txt, doc, docx, pdf)';
    } else if (selectedRole === 'project-manager') {
      // Project Manager: PRD documents
      allowedTypes = [
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/pdf'
      ];
      maxFiles = 1; // Only one PRD file at a time
      fileTypeDescription = language === 'ar' 
        ? 'مستند PRD (doc, docx, pdf)' 
        : 'PRD document (doc, docx, pdf)';
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB per file

    // Check file count
    if (files.length > maxFiles) {
      alert(language === 'ar' 
        ? `يمكن تحميل ${maxFiles} ${maxFiles === 1 ? 'ملف' : 'ملفات'} كحد أقصى` 
        : `Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed`);
      return;
    }

    // Validate file types and sizes
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    const oversizedFiles = files.filter(file => file.size > maxFileSize);

    if (invalidFiles.length > 0) {
      alert(language === 'ar' 
        ? `أنواع ملفات غير مدعومة. الرجاء تحميل ${fileTypeDescription} أقل من 10 ميجابايت` 
        : `Unsupported file types. Please upload ${fileTypeDescription} under 10MB each`);
      return;
    }

    if (oversizedFiles.length > 0) {
      alert(language === 'ar' 
        ? `ملفات تتجاوز الحد الأقصى (10MB): ${oversizedFiles.map(f => f.name).join(', ')}` 
        : `Files exceed maximum size (10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Special validation for Project Manager PRD files
    if (selectedRole === 'project-manager') {
      const nonPRDFiles = files.filter(file => !file.name.toLowerCase().includes('prd'));
      if (nonPRDFiles.length > 0) {
        const shouldContinue = confirm(language === 'ar' 
          ? `تحذير: بعض الملفات قد لا تكون مستندات PRD:\n${nonPRDFiles.map(f => f.name).join('\n')}\n\nهل تريد المتابعة؟`
          : `Warning: Some files may not be PRD documents:\n${nonPRDFiles.map(f => f.name).join('\n')}\n\nDo you want to continue?`);
        
        if (!shouldContinue) {
          return;
        }
      }
    }

    setIsProcessingFiles(true);
    setUploadedFiles(files);

    try {
      if (onFileUpload) {
        console.log('Calling onFileUpload...');
        await onFileUpload(files);
      } else {
        console.error('onFileUpload callback is not provided');
      }
    } catch (error) {
      console.error('Error processing files:', error);
      alert(language === 'ar' 
        ? 'خطأ في معالجة الملفات' 
        : 'Error processing files');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    
    if (newFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAllFiles = () => {
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  const handleSendWithAudio = () => {
    if (audioBlob) {
      console.log('Audio recording available:', audioBlob);
      clearRecording();
    }
    onSendMessage();
  };

  // ✅ NEW: Determine if input should be disabled based on conversation state
  const shouldDisableInput = () => {
    if (selectedRole === 'product-manager') {
      // Disable text input when waiting for button interactions
      return ['awaiting_upload_decision', 'awaiting_task_decision', 'awaiting_test_decision'].includes(conversationState || '');
    }
    return false;
  };

  // ✅ NEW: Get conversation-aware placeholder text
  const getConversationAwarePlaceholder = () => {
    if (selectedRole === 'product-manager') {
      switch (conversationState) {
        case 'awaiting_upload_decision':
          return language === 'ar' ? 'استخدم الأزرار أعلاه للاختيار...' : 'Use buttons above to choose...';
        case 'awaiting_files':
          return language === 'ar' ? 'قم بتحميل ملفات المتطلبات...' : 'Upload requirements files...';
        case 'awaiting_task_decision':
          return language === 'ar' ? 'استخدم الأزرار أعلاه للاختيار...' : 'Use buttons above to choose...';
        case 'awaiting_test_decision':
          return language === 'ar' ? 'استخدم الأزرار أعلاه للاختيار...' : 'Use buttons above to choose...';
        case 'completed':
          return language === 'ar' ? 'تم إكمال العملية بنجاح!' : 'Process completed successfully!';
        default:
          return uploadGuidance.placeholder;
      }
    }
    return uploadGuidance.placeholder;
  };

  if (isDynamicRole) return null;

  const uploadGuidance = getUploadGuidance();

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Multiple Files Upload Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {uploadedFiles.length} {language === 'ar' ? 'ملف محدد' : 'files selected'}
                </span>
                <span className="text-xs text-blue-600">
                  ({(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(1)} KB total)
                </span>
                {selectedRole === 'project-manager' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {language === 'ar' ? 'PRD للاختبار' : 'PRD for Testing'}
                  </span>
                )}
              </div>
              <button
                onClick={removeAllFiles}
                className="text-blue-600 hover:text-blue-800 text-xs"
                disabled={isProcessingFiles}
              >
                {language === 'ar' ? 'إزالة الكل' : 'Remove All'}
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-700 truncate">{file.name}</span>
                    <span className="text-xs text-blue-500 flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
                    disabled={isProcessingFiles}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Recording Preview */}
        {audioBlob && uploadedFiles.length === 0 && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  {language === 'ar' ? 'تم تسجيل الصوت' : 'Audio recorded'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={playRecording}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRecording}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={getConversationAwarePlaceholder()} // ✅ NEW: Conversation-aware placeholder
              className="min-h-[60px] resize-none pr-32"
              disabled={isLoading || isProcessingFiles || shouldDisableInput()} // ✅ NEW: Conversation-aware disable
            />
            <div className="absolute right-2 top-2 flex space-x-1">
              {/* Repository Linking - Enhanced for Backend Developer */}
              <Button
                size="sm"
                variant="ghost"
                onClick={canLinkRepository() ? handleRepoLink : () => setShowRepositorySelector(!showRepositorySelector)}
                title={canLinkRepository() 
                  ? (language === 'ar' ? 'ربط مستودع Azure DevOps' : 'Link Azure DevOps Repository')
                  : (language === 'ar' ? 'اختيار المستودع' : 'Select Repository')
                }
                disabled={isLoading}
                className={!canLinkRepository() ? '' : 'text-blue-600 hover:text-blue-700'}
              >
                <GitBranch className="w-4 h-4" />
              </Button>

              {/* Repository Selection Popover for other roles */}
              {!canLinkRepository() && (
                <Popover open={showRepositorySelector} onOpenChange={setShowRepositorySelector}>
                  <PopoverTrigger asChild>
                    <div></div>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end">
                    <QuickRepositoryAccess 
                      language={language}
                      isOpen={showRepositorySelector}
                      onToggle={() => setShowRepositorySelector(!showRepositorySelector)}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Voice Recording */}
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "ghost"}
                onClick={handleVoiceToggle}
                title={language === 'ar' 
                  ? (isRecording ? 'إيقاف التسجيل' : 'تسجيل صوت') 
                  : (isRecording ? 'Stop Recording' : 'Record Voice')
                }
                className={isRecording ? 'animate-pulse' : ''}
                disabled={uploadedFiles.length > 0 || shouldDisableInput()} // ✅ NEW: Conversation-aware disable
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* ✅ ENHANCED: File Upload with conversation state awareness */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFileUpload}
                title={uploadGuidance.title}
                disabled={isProcessingFiles || !canUploadFiles()}
                className={!canUploadFiles() ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Upload className={`w-4 h-4 ${isProcessingFiles ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <Button
            onClick={audioBlob ? handleSendWithAudio : onSendMessage}
            disabled={(!inputMessage.trim() && !audioBlob && uploadedFiles.length === 0) || isLoading || isProcessingFiles || shouldDisableInput()} // ✅ NEW: Conversation-aware disable
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            {isProcessingFiles 
              ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
              : t.send}
          </Button>
        </div>
        
        {/* ✅ ENHANCED: Conversation-aware status text */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{shouldDisableInput() ? (language === 'ar' ? 'استخدم الأزرار أعلاه' : 'Use buttons above') : t.pressEnter}</span>
          <div className="flex items-center space-x-4">
            {canUploadFiles() && conversationState === 'awaiting_files' && (
              <span className="text-green-600 font-medium">
                {language === 'ar' ? '📁 جاهز لتحميل الملفات' : '📁 Ready for file upload'}
              </span>
            )}
            {canUploadFiles() && conversationState !== 'awaiting_files' && selectedRole === 'product-manager' && (
              <span className="text-blue-600">
                {language === 'ar' ? 'استخدم الأزرار التفاعلية' : 'Use interactive buttons'}
              </span>
            )}
            {canUploadFiles() && selectedRole === 'project-manager' && (
              <span className="text-green-600">
                {uploadGuidance.description}
              </span>
            )}
            {canLinkRepository() && (
              <span className="text-blue-600">
                {language === 'ar' ? 'اربط مستودع Azure DevOps لإنشاء مشروع' : 'Link Azure DevOps repo to create project'}
              </span>
            )}
            {!canUploadFiles() && !canLinkRepository() && (
              <span className="text-red-500">
                {language === 'ar' 
                  ? 'الوظائف المتقدمة متاحة لأدوار محددة' 
                  : 'Advanced features available for specific roles'
                }
              </span>
            )}
            {!shouldDisableInput() && (
              <span>{language === 'ar' ? 'سجل صوت' : 'Record voice'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Azure DevOps Repository Dialog */}
      {showAzureRepoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              {language === 'ar' ? 'ربط مستودع Azure DevOps' : 'Link Azure DevOps Repository'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'رابط المؤسسة' : 'Organization URL'}
                </label>
                <Input
                  value={azureOrgUrl}
                  onChange={(e) => setAzureOrgUrl(e.target.value)}
                  placeholder="https://dev.azure.com/organization"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'رابط مؤسسة Azure DevOps الخاصة بك'
                    : 'Your Azure DevOps organization URL'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'اسم المشروع' : 'Project Name'}
                </label>
                <Input
                  value={azureProjectName}
                  onChange={(e) => setAzureProjectName(e.target.value)}
                  placeholder="MyProject"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'اسم المشروع في Azure DevOps'
                    : 'Existing project name in Azure DevOps'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'اسم المستودع الجديد' : 'New Repository Name'}
                </label>
                <Input
                  value={azureRepoName}
                  onChange={(e) => setAzureRepoName(e.target.value)}
                  placeholder="nodejs-auth-project"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'اسم المستودع الجديد الذي سيتم إنشاؤه'
                    : 'Name for the new repository to be created'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'رمز Azure DevOps الشخصي' : 'Azure DevOps Personal Access Token'}
                </label>
                <Input
                  type="password"
                  value={azurePat}
                  onChange={(e) => setAzurePat(e.target.value)}
                  placeholder="Personal Access Token"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' 
                    ? 'يجب أن يحتوي الرمز على صلاحيات Code (read & write)'
                    : 'Token must have Code (read & write) permissions'
                  }
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  {language === 'ar' ? 'ما سيتم إنشاؤه:' : 'What will be created:'}
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• {language === 'ar' ? 'مستودع جديد في Azure DevOps' : 'New repository in Azure DevOps'}</li>
                  <li>• {language === 'ar' ? 'مشروع Node.js كامل مع Express' : 'Complete Node.js project with Express'}</li>
                  <li>• {language === 'ar' ? 'نظام تسجيل دخول وتسجيل مستخدم' : 'Login and Register authentication system'}</li>
                  <li>• {language === 'ar' ? 'قاعدة بيانات MongoDB' : 'MongoDB database integration'}</li>
                  <li>• {language === 'ar' ? 'حماية JWT وتشفير كلمات المرور' : 'JWT security and password encryption'}</li>
                  <li>• {language === 'ar' ? 'إعداد CI/CD جاهز' : 'CI/CD pipeline ready setup'}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleAzureRepoSubmit} 
                disabled={!azureOrgUrl.trim() || !azureProjectName.trim() || !azureRepoName.trim() || !azurePat.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {language === 'ar' ? 'إنشاء المستودع والمشروع' : 'Create Repository & Project'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAzureRepoDialog(false);
                  setAzureOrgUrl('');
                  setAzureProjectName('');
                  setAzureRepoName('');
                  setAzurePat('');
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={uploadGuidance.acceptedTypes}
        multiple={selectedRole === 'product-manager'} // Multiple files only for Product Manager
        onChange={handleFileChange}
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default ChatInput;
