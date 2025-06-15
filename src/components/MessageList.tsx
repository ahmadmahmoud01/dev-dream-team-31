
import React from 'react';
import { Message, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';

interface MessageListProps {
  messages: Message[];
  language: Language;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, language, isLoading }) => {
  const roleConfig = getRoleConfig(language);

  const getTranslations = (language: Language) => ({
    ar: { thinking: 'الذكي الاصطناعي يفكر...' },
    en: { thinking: 'AI is thinking...' }
  }[language]);

  const t = getTranslations(language);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-3xl ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-4 shadow-sm`}>
            {message.sender === 'ai' && message.aiRole && (
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-1 rounded ${roleConfig[message.aiRole].color} text-white`}>
                  {React.createElement(roleConfig[message.aiRole].icon, { className: 'w-3 h-3' })}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {roleConfig[message.aiRole].name}
                </span>
              </div>
            )}
            <div className={`${message.sender === 'user' ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>
              {message.content}
            </div>
            <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString('ar')}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">{t.thinking}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
