
import React, { useRef, useState } from 'react';
import { Send, Upload, Mic, MicOff, GitBranch, X, Play } from 'lucide-react';
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
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputMessage,
  setInputMessage,
  onSendMessage,
  onKeyPress,
  selectedRole,
  language,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
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
      // يمكن إضافة معالجة الصوت هنا لاحقاً
      console.log('Audio recording available:', audioBlob);
      clearRecording();
    }
    onSendMessage();
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Audio Recording Preview */}
        {audioBlob && (
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
              placeholder={`${t.placeholder} ${currentRole.name}...`}
              className="min-h-[60px] resize-none pr-32"
              disabled={isLoading}
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
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* File Upload */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFileUpload}
                title={language === 'ar' ? 'رفع ملفات' : 'Upload Files'}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={audioBlob ? handleSendWithAudio : onSendMessage}
            disabled={(!inputMessage.trim() && !audioBlob) || isLoading}
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            {t.send}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{t.pressEnter}</span>
          <div className="flex items-center space-x-4">
            <span>{language === 'ar' ? 'اختر المستودع' : 'Select repository'}</span>
            <span>{language === 'ar' ? 'سجل صوت' : 'Record voice'}</span>
            <span>{language === 'ar' ? 'ارفع الملفات' : 'Upload files'}</span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md"
        multiple
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default ChatInput;
