
import React, { useRef, useState } from 'react';
import { Send, Upload, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';
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
  const [showRepositorySelector, setShowRepositorySelector] = useState(false);
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleRepositorySelector = () => {
    setShowRepositorySelector(!showRepositorySelector);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={`${t.placeholder} ${currentRole.name}...`}
              className="min-h-[60px] resize-none pr-20"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-2 flex space-x-1">
              <Popover open={showRepositorySelector} onOpenChange={setShowRepositorySelector}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleRepositorySelector}
                    title={language === 'ar' ? 'اختيار مستودع' : 'Select Repository'}
                  >
                    <GitBranch className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <QuickRepositoryAccess 
                    language={language}
                    isOpen={showRepositorySelector}
                    onToggle={toggleRepositorySelector}
                  />
                </PopoverContent>
              </Popover>
              
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
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            {t.send}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{t.pressEnter}</span>
          <div className="flex items-center space-x-4">
            <span>{language === 'ar' ? 'اختر مستودع أو ارفع الملفات' : 'Select repository or upload files'}</span>
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
    </div>
  );
};

export default ChatInput;
