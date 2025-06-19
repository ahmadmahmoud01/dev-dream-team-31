import React, { useRef, useState } from 'react';
import { Send, Upload, Mic, MicOff, GitBranch, X, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  onFileUpload?: (files: File[]) => void; // Changed to accept multiple files
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Changed to array
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Only allow file upload for Product Manager role
    if (selectedRole !== 'product-manager') {
      alert(language === 'ar' 
        ? 'تحميل الملفات متاح فقط لمدير المنتج' 
        : 'File upload is only available for Product Manager');
      return;
    }

    // Validate file types and sizes
    const allowedTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const maxFiles = 5; // Maximum 5 files

    if (files.length > maxFiles) {
      alert(language === 'ar' 
        ? `يمكن تحميل ${maxFiles} ملفات كحد أقصى` 
        : `Maximum ${maxFiles} files allowed`);
      return;
    }

    const invalidFiles = files.filter(file => 
      !allowedTypes.includes(file.type) || file.size > maxFileSize
    );

    if (invalidFiles.length > 0) {
      alert(language === 'ar' 
        ? 'الرجاء تحميل ملفات نصية صالحة (txt, doc, docx, pdf) أقل من 10 ميجابايت' 
        : 'Please upload valid text files (.txt, .doc, .docx, .pdf) under 10MB each');
      return;
    }

    setIsProcessingFiles(true);
    setUploadedFiles(files);

    try {
      if (onFileUpload) {
        onFileUpload(files);
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

  if (isDynamicRole) return null;

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
              placeholder={
                selectedRole === 'product-manager'
                  ? (language === 'ar' 
                      ? 'قم بتحميل ملفات المتطلبات أو اكتب رسالتك...' 
                      : 'Upload requirements files or type your message...')
                  : `${t.placeholder} ${currentRole.name}...`
              }
              className="min-h-[60px] resize-none pr-32"
              disabled={isLoading || isProcessingFiles}
            />
            <div className="absolute right-2 top-2 flex space-x-1">
              {/* Repository Selection */}
              <Popover open={showRepositorySelector} onOpenChange={setShowRepositorySelector}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={language === 'ar' ? 'اختيار المستودع' : 'Select Repository'}
                  >
                    <GitBranch className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <QuickRepositoryAccess 
                    language={language}
                    isOpen={showRepositorySelector}
                    onToggle={() => setShowRepositorySelector(!showRepositorySelector)}
                  />
                </PopoverContent>
              </Popover>

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
                disabled={uploadedFiles.length > 0}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* File Upload */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFileUpload}
                title={
                  selectedRole === 'product-manager'
                    ? (language === 'ar' ? 'تحميل متطلبات المشروع' : 'Upload Project Requirements')
                    : (language === 'ar' ? 'رفع ملفات' : 'Upload Files')
                }
                disabled={isProcessingFiles}
              >
                <Upload className={`w-4 h-4 ${isProcessingFiles ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <Button
            onClick={audioBlob ? handleSendWithAudio : onSendMessage}
            disabled={(!inputMessage.trim() && !audioBlob && uploadedFiles.length === 0) || isLoading || isProcessingFiles}
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            {isProcessingFiles 
              ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
              : t.send}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{t.pressEnter}</span>
          <div className="flex items-center space-x-4">
            {selectedRole === 'product-manager' && (
              <span>
                {language === 'ar' 
                  ? 'حدد ملفات المتطلبات (حد أقصى 5)' 
                  : 'Select requirements files (max 5)'
                }
              </span>
            )}
            <span>{language === 'ar' ? 'اختر المستودع' : 'Select repository'}</span>
            <span>{language === 'ar' ? 'سجل صوت' : 'Record voice'}</span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.doc,.docx,.pdf"
        multiple // Added multiple attribute
        onChange={handleFileChange}
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default ChatInput;
