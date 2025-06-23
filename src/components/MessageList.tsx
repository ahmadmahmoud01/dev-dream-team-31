import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Language } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { Button } from '@/components/ui/button';

// ✅ ENHANCED: Extended Message type to support buttons
interface EnhancedMessage extends Message {
  buttons?: Array<{
    id: string;
    text: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
  }>;
}

interface MessageListProps {
  messages: Message[];
  language: Language;
  isLoading: boolean;
  onButtonClick?: (action: string) => void; // ✅ NEW: Button click handler
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  language, 
  isLoading,
  onButtonClick 
}) => {
  const roleConfig = getRoleConfig(language);

  const getTranslations = (language: Language) => ({
    ar: { thinking: 'الذكي الاصطناعي يفكر...' },
    en: { thinking: 'AI is thinking...' }
  }[language]);

  const t = getTranslations(language);

  // ✅ NEW: Interactive Buttons Component
  const InteractiveButtons: React.FC<{ 
    buttons: Array<{
      id: string;
      text: string;
      action: string;
      variant?: 'primary' | 'secondary' | 'success' | 'danger';
    }>;
    onButtonClick: (action: string) => void;
    language: Language;
  }> = ({ buttons, onButtonClick, language }) => {
    const getButtonClassName = (variant?: string) => {
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm';
        case 'secondary':
          return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
        case 'danger':
          return 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-sm';
        default:
          return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      }
    };

    return (
      <div className={`flex flex-wrap gap-2 mt-3 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
        {buttons.map((button) => (
          <Button
            key={button.id}
            onClick={() => onButtonClick(button.action)}
            className={`transition-all duration-200 text-sm px-4 py-2 rounded-md font-medium ${getButtonClassName(button.variant)}`}
            size="sm"
          >
            {button.text}
          </Button>
        ))}
      </div>
    );
  };

  // ✅ ENHANCED: Message Content Renderer with Markdown Support
  const MessageContent: React.FC<{ 
    content: string; 
    isUser: boolean; 
  }> = ({ content, isUser }) => {
    // For user messages, render as plain text
    if (isUser) {
      return (
        <div className="text-white whitespace-pre-wrap">
          {content}
        </div>
      );
    }

    // For AI messages, render with Markdown support
    return (
      <div className="text-gray-900 prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-medium text-gray-900 mb-1">{children}</h3>,
            p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-gray-800">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
            code: ({ children }) => (
              <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm font-mono mb-2">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-700 mb-2">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-gray-300 my-3" />,
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // ✅ ENHANCED: Role Badge Component
  const RoleBadge: React.FC<{ 
    aiRole: string; 
    language: Language; 
  }> = ({ aiRole, language }) => {
    const role = roleConfig[aiRole];
    if (!role) return null;

    return (
      <div className="flex items-center space-x-2 mb-3">
        <div className={`p-1.5 rounded-md ${role.color} text-white shadow-sm`}>
          {React.createElement(role.icon, { className: 'w-3 h-3' })}
        </div>
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
          {role.name}
        </span>
      </div>
    );
  };

  // ✅ ENHANCED: Message Timestamp Component
  const MessageTimestamp: React.FC<{ 
    timestamp: Date; 
    isUser: boolean; 
    language: Language; 
  }> = ({ timestamp, isUser, language }) => {
    const formatTime = (date: Date, lang: Language) => {
      return date.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: lang === 'en'
      });
    };

    return (
      <div className={`text-xs mt-3 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
        {formatTime(timestamp, language)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const enhancedMessage = message as EnhancedMessage;
        
        return (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${
              message.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-200'
            } rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
              
              {/* ✅ ENHANCED: Role Badge for AI messages */}
              {message.sender === 'ai' && message.aiRole && (
                <RoleBadge aiRole={message.aiRole} language={language} />
              )}
              
              {/* ✅ ENHANCED: Message Content with Markdown */}
              <MessageContent 
                content={message.content} 
                isUser={message.sender === 'user'} 
              />
              
              {/* ✅ NEW: Interactive Buttons */}
              {enhancedMessage.buttons && 
               enhancedMessage.buttons.length > 0 && 
               onButtonClick && 
               message.sender === 'ai' && (
                <InteractiveButtons
                  buttons={enhancedMessage.buttons}
                  onButtonClick={onButtonClick}
                  language={language}
                />
              )}
              
              {/* ✅ ENHANCED: Message Timestamp */}
              <MessageTimestamp 
                timestamp={message.timestamp} 
                isUser={message.sender === 'user'} 
                language={language} 
              />
            </div>
          </div>
        );
      })}

      {/* ✅ ENHANCED: Loading Indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">{t.thinking}</span>
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
