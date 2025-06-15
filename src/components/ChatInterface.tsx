
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Download, Code, TestTube, FileText, User, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiRole?: 'tester' | 'analyst' | 'engineer';
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<'tester' | 'analyst' | 'engineer'>('engineer');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const roleConfig = {
    tester: {
      name: 'Software Tester',
      icon: TestTube,
      color: 'bg-emerald-500',
      description: 'Expert in test case design, bug analysis, and QA processes',
      examples: [
        'كيف أختبر واجهة تسجيل الدخول؟',
        'أكتب لي حالات اختبار لنظام التجارة الإلكترونية',
        'ما هي أفضل ممارسات اختبار الأداء؟',
        'كيف أتأكد من أمان التطبيق؟'
      ]
    },
    analyst: {
      name: 'BRD Analyst',
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Specialist in requirements analysis and business documentation',
      examples: [
        'اكتب لي وثيقة متطلبات لنظام إدارة المستودعات',
        'حلل متطلبات العمل لتطبيق التوصيل',
        'ما هي الخطوات لكتابة BRD فعال؟',
        'كيف أحدد أصحاب المصلحة في المشروع؟'
      ]
    },
    engineer: {
      name: 'Software Engineer',
      icon: Code,
      color: 'bg-purple-500',
      description: 'Full-stack developer with expertise in architecture and coding',
      examples: [
        'اكتب لي API لإدارة المستخدمين بـ Node.js',
        'كيف أصمم قاعدة بيانات لنظام التجارة الإلكترونية؟',
        'ما هي أفضل ممارسات React.js؟',
        'راجع هذا الكود وحسن الأداء'
      ]
    }
  };

  const handleExampleClick = (example: string) => {
    setInputMessage(example);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response based on role
    setTimeout(() => {
      const aiResponse = generateRoleBasedResponse(inputMessage, selectedRole);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        aiRole: selectedRole
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateRoleBasedResponse = (input: string, role: string) => {
    const responses = {
      tester: `As a Software Tester, I'll help you with: ${input}

**Test Strategy Recommendation:**
- **Functional Testing**: Verify core functionality meets requirements
- **Edge Case Analysis**: Test boundary conditions and error scenarios
- **Performance Testing**: Ensure system handles expected load
- **Security Testing**: Validate data protection and access controls

**Suggested Test Cases:**
1. Happy path scenarios
2. Negative test cases
3. Data validation tests
4. Integration testing points

Would you like me to create detailed test cases or analyze specific testing scenarios?`,

      analyst: `As a BRD Analyst, I'll analyze: ${input}

**Requirements Analysis:**
- **Functional Requirements**: Core system capabilities needed
- **Non-Functional Requirements**: Performance, security, usability standards
- **Stakeholder Impact**: User roles and business process changes
- **Acceptance Criteria**: Measurable success metrics

**Documentation Structure:**
1. Executive Summary
2. Business Objectives
3. Functional Specifications
4. Technical Requirements
5. Risk Assessment

Would you like me to help structure your BRD or analyze specific requirements?`,

      engineer: `As a Software Engineer, I'll help you with: ${input}

**Technical Analysis:**
- **Architecture Recommendations**: Scalable system design patterns
- **Technology Stack**: Optimal frameworks and tools selection
- **Implementation Strategy**: Phased development approach
- **Code Quality**: Best practices and standards

**Development Approach:**
1. Requirements breakdown
2. System architecture design
3. API design and data modeling
4. Implementation phases
5. Testing and deployment strategy

Would you like me to dive deeper into the technical implementation or review specific code?`
    };

    return responses[role as keyof typeof responses];
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${currentRole.color} text-white`}>
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">GPT Mate</h1>
                <p className="text-sm text-gray-500">AI Software Development Assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Role Description */}
      <div className="bg-white border-b border-gray-100 p-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <RoleIcon className="w-3 h-3" />
              <span>{currentRole.name}</span>
            </Badge>
            <span className="text-sm text-gray-600">{currentRole.description}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className={`inline-flex p-4 rounded-full ${currentRole.color} text-white mb-4`}>
                <RoleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hello! I'm your AI {currentRole.name}
              </h3>
              <p className="text-gray-600 mb-6">{currentRole.description}</p>
              
              {/* Examples Section */}
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h4 className="text-md font-medium text-gray-800">Try these examples:</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentRole.examples.map((example, index) => (
                    <Card
                      key={index}
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500 bg-white"
                      onClick={() => handleExampleClick(example)}
                    >
                      <p className="text-sm text-gray-700 text-right">{example}</p>
                    </Card>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Upload documents, ask questions, or click on an example above to get started!
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-4 shadow-sm`}>
                {message.sender === 'ai' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${roleConfig[message.aiRole!].color} text-white`}>
                      {React.createElement(roleConfig[message.aiRole!].icon, { className: 'w-3 h-3' })}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {roleConfig[message.aiRole!].name}
                    </span>
                  </div>
                )}
                <div className={`${message.sender === 'user' ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask your AI ${currentRole.name} anything...`}
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
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Upload files for analysis</span>
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

export default ChatInterface;
