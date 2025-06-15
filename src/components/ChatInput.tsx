
import React, { useRef } from 'react';
import { Send, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';

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
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];

  const handleFileUpload = () => {
    fileInputRef.current?.click();
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
              className="min-h-[60px] resize-none pr-12"
              disabled={isLoading}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-2"
              onClick={handleFileUpload}
            >
              <Upload className="w-4 h-4" />
            </Button>
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
          <span>{t.uploadDocs}</span>
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
