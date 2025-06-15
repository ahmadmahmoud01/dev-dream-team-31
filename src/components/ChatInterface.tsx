
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Download, Code, TestTube, FileText, User, Lightbulb, Trash2, Save, BarChart3, Database, Smartphone, Server, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiRole?: 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack';
}

interface ConversationMemory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  role: 'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack';
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<'tester' | 'frontend' | 'business-analyst' | 'backend' | 'mobile' | 'devops' | 'fullstack'>('tester');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationMemory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatbot-conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed.map((conv: any) => ({
        ...conv,
        lastUpdated: new Date(conv.lastUpdated),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = (newConversations: ConversationMemory[]) => {
    localStorage.setItem('chatbot-conversations', JSON.stringify(newConversations));
    setConversations(newConversations);
  };

  const translations = {
    ar: {
      title: 'GPT Mate',
      subtitle: 'مساعد الذكي لتطوير البرمجيات',
      tester: 'مختبر البرمجيات',
      frontend: 'مطور واجهات المستخدم',
      'business-analyst': 'محلل الأعمال',
      backend: 'مطور الخادم',
      mobile: 'مطور التطبيقات المحمولة',
      devops: 'مهندس DevOps',
      fullstack: 'مطور الويب المتكامل',
      testerDesc: 'خبير في تصميم حالات الاختبار وتحليل الأخطاء وعمليات ضمان الجودة',
      frontendDesc: 'متخصص في تطوير واجهات المستخدم وتقنيات الفرونت إند الحديثة',
      'business-analystDesc': 'خبير في تحليل متطلبات العمل وتصميم العمليات والحلول التقنية',
      backendDesc: 'متخصص في تطوير خوادم التطبيقات وقواعد البيانات والخدمات الخلفية',
      mobileDesc: 'خبير في تطوير تطبيقات الهواتف الذكية والأجهزة المحمولة',
      devopsDesc: 'متخصص في نشر التطبيقات وإدارة البنية التحتية والأتمتة',
      fullstackDesc: 'مطور شامل متخصص في الفرونت إند والباك إند وقواعد البيانات',
      newChat: 'محادثة جديدة',
      saveChat: 'حفظ المحادثة',
      clearHistory: 'مسح السجل',
      export: 'تصدير',
      send: 'إرسال',
      thinking: 'الذكي الاصطناعي يفكر...',
      placeholder: 'اسأل مساعدك الذكي أي شيء...',
      examples: 'جرب هذه الأمثلة:',
      uploadDocs: 'ارفع الملفات للتحليل',
      pressEnter: 'اضغط Enter للإرسال، Shift+Enter لسطر جديد',
      hello: 'مرحباً! أنا مساعدك الذكي',
      getStarted: 'ارفع المستندات أو اطرح الأسئلة أو انقر على مثال أعلاه للبدء!'
    },
    en: {
      title: 'GPT Mate',
      subtitle: 'AI Software Development Assistant',
      tester: 'Software Tester',
      frontend: 'Frontend Developer',
      'business-analyst': 'Business Analyst',
      backend: 'Backend Developer',
      mobile: 'Mobile Developer',
      devops: 'DevOps Engineer',
      fullstack: 'Full Stack Developer',
      testerDesc: 'Expert in test case design, bug analysis, and QA processes',
      frontendDesc: 'Specialist in UI/UX development and modern frontend technologies',
      'business-analystDesc': 'Expert in business requirements analysis and process design',
      backendDesc: 'Specialist in server-side development and database management',
      mobileDesc: 'Expert in mobile app development for iOS and Android platforms',
      devopsDesc: 'Specialist in deployment, infrastructure management, and automation',
      fullstackDesc: 'Comprehensive developer skilled in frontend, backend, and databases',
      newChat: 'New Chat',
      saveChat: 'Save Chat',
      clearHistory: 'Clear History',
      export: 'Export',
      send: 'Send',
      thinking: 'AI is thinking...',
      placeholder: 'Ask your AI assistant anything...',
      examples: 'Try these examples:',
      uploadDocs: 'Upload files for analysis',
      pressEnter: 'Press Enter to send, Shift+Enter for new line',
      hello: 'Hello! I\'m your AI',
      getStarted: 'Upload documents, ask questions, or click on an example above to get started!'
    }
  };

  const t = translations[language];

  const roleConfig = {
    tester: {
      name: t.tester,
      icon: TestTube,
      color: 'bg-emerald-500',
      description: t.testerDesc,
      examples: language === 'ar' ? [
        'كيف أختبر واجهة تسجيل الدخول؟',
        'أكتب لي حالات اختبار لنظام التجارة الإلكترونية',
        'ما هي أفضل ممارسات اختبار الأداء؟',
        'كيف أتأكد من أمان التطبيق؟'
      ] : [
        'How do I test a login interface?',
        'Write test cases for an e-commerce system',
        'What are the best performance testing practices?',
        'How do I ensure application security?'
      ]
    },
    frontend: {
      name: t.frontend,
      icon: Code,
      color: 'bg-blue-500',
      description: t.frontendDesc,
      examples: language === 'ar' ? [
        'كيف أنشئ مكون React قابل لإعادة الاستخدام؟',
        'ما هي أفضل ممارسات CSS للتصميم المتجاوب؟',
        'كيف أحسن أداء التطبيق في الفرونت إند؟',
        'اشرح لي مفهوم State Management في React'
      ] : [
        'How do I create a reusable React component?',
        'What are the best CSS practices for responsive design?',
        'How do I optimize frontend application performance?',
        'Explain State Management concepts in React'
      ]
    },
    'business-analyst': {
      name: t['business-analyst'],
      icon: BarChart3,
      color: 'bg-purple-500',
      description: t['business-analystDesc'],
      examples: language === 'ar' ? [
        'كيف أحلل متطلبات العمل للمشروع الجديد؟',
        'ما هي أفضل طرق توثيق العمليات التجارية؟',
        'كيف أصمم تدفق العمل للنظام الجديد؟',
        'اشرح لي كيفية كتابة وثيقة متطلبات الأعمال'
      ] : [
        'How do I analyze business requirements for a new project?',
        'What are the best methods for documenting business processes?',
        'How do I design workflow for a new system?',
        'Explain how to write a Business Requirements Document'
      ]
    },
    backend: {
      name: t.backend,
      icon: Server,
      color: 'bg-green-600',
      description: t.backendDesc,
      examples: language === 'ar' ? [
        'كيف أصمم قاعدة بيانات فعالة؟',
        'ما هي أفضل ممارسات تطوير API؟',
        'كيف أحسن أداء الاستعلامات في قاعدة البيانات؟',
        'اشرح لي مفهوم المعمارية المجهرية'
      ] : [
        'How do I design an efficient database?',
        'What are the best practices for API development?',
        'How do I optimize database query performance?',
        'Explain microservices architecture concepts'
      ]
    },
    mobile: {
      name: t.mobile,
      icon: Smartphone,
      color: 'bg-orange-500',
      description: t.mobileDesc,
      examples: language === 'ar' ? [
        'كيف أطور تطبيق محمول باستخدام React Native؟',
        'ما هي أفضل ممارسات تصميم واجهة التطبيقات المحمولة؟',
        'كيف أحسن أداء التطبيق المحمول؟',
        'اشرح لي الفرق بين التطوير الأصيل والمختلط'
      ] : [
        'How do I develop a mobile app using React Native?',
        'What are the best practices for mobile UI design?',
        'How do I optimize mobile app performance?',
        'Explain the difference between native and hybrid development'
      ]
    },
    devops: {
      name: t.devops,
      icon: Settings,
      color: 'bg-gray-600',
      description: t.devopsDesc,
      examples: language === 'ar' ? [
        'كيف أنشئ خط إنتاج CI/CD؟',
        'ما هي أفضل ممارسات إدارة الحاويات؟',
        'كيف أراقب أداء التطبيق في الإنتاج؟',
        'اشرح لي مفهوم Infrastructure as Code'
      ] : [
        'How do I set up a CI/CD pipeline?',
        'What are the best practices for container management?',
        'How do I monitor application performance in production?',
        'Explain Infrastructure as Code concepts'
      ]
    },
    fullstack: {
      name: t.fullstack,
      icon: Database,
      color: 'bg-indigo-600',
      description: t.fullstackDesc,
      examples: language === 'ar' ? [
        'كيف أبني تطبيق ويب متكامل من الصفر؟',
        'ما هي أفضل التقنيات للتطوير المتكامل؟',
        'كيف أربط الفرونت إند بالباك إند بكفاءة؟',
        'اشرح لي معمارية التطبيقات الحديثة'
      ] : [
        'How do I build a complete web application from scratch?',
        'What are the best technologies for full-stack development?',
        'How do I efficiently connect frontend with backend?',
        'Explain modern application architecture'
      ]
    }
  };

  const handleExampleClick = (example: string) => {
    setInputMessage(example);
  };

  const createNewConversation = () => {
    const newConversation: ConversationMemory = {
      id: Date.now().toString(),
      title: `${roleConfig[selectedRole].name} - ${new Date().toLocaleDateString('ar')}`,
      messages: [],
      lastUpdated: new Date(),
      role: selectedRole
    };
    
    const updatedConversations = [...conversations, newConversation];
    saveConversations(updatedConversations);
    setCurrentConversationId(newConversation.id);
    setMessages([]);

    toast({
      title: language === 'ar' ? 'تم إنشاء محادثة جديدة' : 'New conversation created',
      description: language === 'ar' ? 'يمكنك الآن بدء محادثة جديدة' : 'You can now start a new conversation'
    });
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setSelectedRole(conversation.role);
      setCurrentConversationId(conversationId);
    }
  };

  const saveCurrentConversation = () => {
    if (!currentConversationId) {
      createNewConversation();
      return;
    }

    const updatedConversations = conversations.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages,
          lastUpdated: new Date()
        };
      }
      return conv;
    });

    saveConversations(updatedConversations);
    
    toast({
      title: language === 'ar' ? 'تم حفظ المحادثة' : 'Conversation saved',
      description: language === 'ar' ? 'تم حفظ محادثتك بنجاح' : 'Your conversation has been saved successfully'
    });
  };

  const clearAllHistory = () => {
    setConversations([]);
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem('chatbot-conversations');
    
    toast({
      title: language === 'ar' ? 'تم مسح السجل' : 'History cleared',
      description: language === 'ar' ? 'تم مسح جميع المحادثات' : 'All conversations have been cleared'
    });
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
      tester: language === 'ar' ? 
        `كمختبر برمجيات، سأساعدك في: ${input}

**استراتيجية الاختبار الموصى بها:**
- **الاختبار الوظيفي**: التحقق من أن الوظائف الأساسية تلبي المتطلبات
- **تحليل الحالات الحدية**: اختبار الشروط الحدية وسيناريوهات الأخطاء
- **اختبار الأداء**: ضمان أن النظام يتحمل الحمولة المتوقعة
- **اختبار الأمان**: التحقق من حماية البيانات وتحكم الوصول

**حالات الاختبار المقترحة:**
1. سيناريوهات المسار السعيد
2. حالات الاختبار السلبية
3. اختبارات التحقق من البيانات
4. نقاط اختبار التكامل

هل تريد مني إنشاء حالات اختبار مفصلة أو تحليل سيناريوهات اختبار محددة؟` :
        `As a Software Tester, I'll help you with: ${input}

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

      frontend: language === 'ar' ?
        `كمطور واجهات المستخدم، سأساعدك في: ${input}

**التحليل التقني:**
- **توصيات التصميم**: أنماط تصميم واجهات قابلة للتوسع
- **اختيار التقنيات**: أفضل الأدوات والمكتبات للمشروع
- **استراتيجية التطوير**: نهج تطوير متدرج ومنظم
- **جودة الكود**: أفضل الممارسات والمعايير

**نهج التطوير:**
1. تحليل المتطلبات وتفكيكها
2. تصميم هيكل المكونات
3. تصميم واجهة المستخدم والتفاعل
4. مراحل التنفيذ
5. اختبار وتحسين الأداء

هل تريد مني التعمق أكثر في التنفيذ التقني أو مراجعة كود محدد؟` :
        `As a Frontend Developer, I'll help you with: ${input}

**Technical Analysis:**
- **Design Recommendations**: Scalable UI design patterns
- **Technology Stack**: Optimal frameworks and tools selection
- **Development Strategy**: Structured development approach
- **Code Quality**: Best practices and standards

**Development Approach:**
1. Requirements analysis and breakdown
2. Component architecture design
3. UI/UX design and interaction
4. Implementation phases
5. Testing and performance optimization

Would you like me to dive deeper into technical implementation or review specific code?`,

      'business-analyst': language === 'ar' ?
        `كمحلل أعمال، سأساعدك في: ${input}

**تحليل متطلبات الأعمال:**
- **تحديد أصحاب المصلحة**: تحديد جميع الأطراف المعنية
- **تحليل العمليات الحالية**: فهم الوضع الراهن والتحديات
- **تحديد المتطلبات**: توثيق المتطلبات الوظيفية وغير الوظيفية
- **تصميم الحلول**: اقتراح حلول تقنية تلبي احتياجات العمل

**خطة العمل:**
1. جمع وتحليل المتطلبات
2. تحليل الفجوات في العمليات الحالية
3. تصميم العمليات المحسنة
4. توثيق مواصفات النظام
5. التحقق من المتطلبات مع أصحاب المصلحة

هل تريد مني تطوير وثيقة متطلبات مفصلة أو تحليل عملية معينة؟` :
        `As a Business Analyst, I'll help you with: ${input}

**Business Requirements Analysis:**
- **Stakeholder Identification**: Identify all involved parties
- **Current Process Analysis**: Understand current state and challenges
- **Requirements Definition**: Document functional and non-functional requirements
- **Solution Design**: Propose technical solutions that meet business needs

**Work Plan:**
1. Requirements gathering and analysis
2. Gap analysis of current processes
3. Improved process design
4. System specification documentation
5. Requirements validation with stakeholders

Would you like me to develop a detailed requirements document or analyze a specific process?`,

      backend: language === 'ar' ?
        `كمطور خادم، سأساعدك في: ${input}

**التحليل التقني للخادم:**
- **تصميم قاعدة البيانات**: هيكل بيانات محسن وقابل للتوسع
- **معمارية API**: تصميم واجهات برمجية فعالة وآمنة
- **الأمان**: تطبيق أفضل ممارسات الحماية والتشفير
- **الأداء**: تحسين سرعة الاستجابة والتعامل مع الأحمال

**استراتيجية التطوير:**
1. تحليل متطلبات النظام والبيانات
2. تصميم قاعدة البيانات والعلاقات
3. تطوير واجهات API وخدمات الويب
4. تطبيق طبقات الأمان والحماية
5. اختبار الأداء والتحسين

هل تريد مني تصميم هيكل قاعدة بيانات أو مراجعة كود API محدد؟` :
        `As a Backend Developer, I'll help you with: ${input}

**Server-Side Technical Analysis:**
- **Database Design**: Optimized and scalable data structure
- **API Architecture**: Efficient and secure programming interfaces
- **Security**: Implementation of best practices for protection and encryption
- **Performance**: Response speed optimization and load handling

**Development Strategy:**
1. System and data requirements analysis
2. Database design and relationships
3. API and web services development
4. Security layers implementation
5. Performance testing and optimization

Would you like me to design a database structure or review specific API code?`,

      mobile: language === 'ar' ?
        `كمطور تطبيقات محمولة، سأساعدك في: ${input}

**تحليل تطوير التطبيقات المحمولة:**
- **اختيار المنصة**: تحديد أفضل نهج للتطوير (أصيل أم مختلط)
- **تصميم واجهة المستخدم**: واجهات محسنة للشاشات الصغيرة
- **الأداء**: تحسين استهلاك البطارية وسرعة التطبيق
- **التجربة**: تطبيق أفضل ممارسات تجربة المستخدم المحمولة

**خطة التطوير:**
1. تحليل متطلبات التطبيق والمنصات المستهدفة
2. تصميم واجهة المستخدم والتفاعل
3. تطوير الوظائف الأساسية
4. اختبار التوافق مع الأجهزة المختلفة
5. نشر التطبيق في المتاجر

هل تريد مني مساعدتك في تصميم واجهة محددة أو مراجعة كود التطبيق؟` :
        `As a Mobile Developer, I'll help you with: ${input}

**Mobile App Development Analysis:**
- **Platform Selection**: Determine best development approach (native vs hybrid)
- **UI Design**: Interfaces optimized for small screens
- **Performance**: Battery consumption and app speed optimization
- **Experience**: Mobile UX best practices implementation

**Development Plan:**
1. App requirements and target platforms analysis
2. UI design and interaction
3. Core functionality development
4. Cross-device compatibility testing
5. App store deployment

Would you like me to help with specific interface design or review app code?`,

      devops: language === 'ar' ?
        `كمهندس DevOps، سأساعدك في: ${input}

**تحليل البنية التحتية والنشر:**
- **خط الإنتاج المستمر**: إعداد CI/CD pipeline فعال
- **إدارة الحاويات**: تطبيق Docker وKubernetes
- **المراقبة**: نظم مراقبة الأداء والتنبيهات
- **الأمان**: حماية البنية التحتية والبيانات

**استراتيجية DevOps:**
1. تحليل البنية التحتية الحالية
2. تصميم خط النشر المؤتمت
3. إعداد بيئات التطوير والإنتاج
4. تطبيق أنظمة المراقبة
5. تحسين الأداء والأمان

هل تريد مني مساعدتك في إعداد CI/CD أو تحسين البنية التحتية؟` :
        `As a DevOps Engineer, I'll help you with: ${input}

**Infrastructure and Deployment Analysis:**
- **Continuous Pipeline**: Efficient CI/CD pipeline setup
- **Container Management**: Docker and Kubernetes implementation
- **Monitoring**: Performance monitoring and alerting systems
- **Security**: Infrastructure and data protection

**DevOps Strategy:**
1. Current infrastructure analysis
2. Automated deployment pipeline design
3. Development and production environments setup
4. Monitoring systems implementation
5. Performance and security optimization

Would you like me to help with CI/CD setup or infrastructure optimization?`,

      fullstack: language === 'ar' ?
        `كمطور ويب متكامل، سأساعدك في: ${input}

**تحليل التطوير المتكامل:**
- **المعمارية الشاملة**: تصميم نظام متكامل من الفرونت إند للباك إند
- **اختيار التقنيات**: أفضل مجموعة تقنيات للمشروع
- **التكامل**: ربط فعال بين طبقات التطبيق المختلفة
- **التوسع**: تصميم قابل للنمو والتطوير

**خطة التطوير المتكاملة:**
1. تحليل المتطلبات الشاملة للمشروع
2. تصميم معمارية النظام الكاملة
3. تطوير واجهة المستخدم والخدمات
4. تطوير قاعدة البيانات والAPI
5. اختبار التكامل والنشر

هل تريد مني مساعدتك في تصميم معمارية شاملة أو مراجعة التكامل بين الطبقات؟` :
        `As a Full Stack Developer, I'll help you with: ${input}

**Full Stack Development Analysis:**
- **Comprehensive Architecture**: Complete system design from frontend to backend
- **Technology Selection**: Best technology stack for the project
- **Integration**: Efficient connection between different application layers
- **Scalability**: Growth and development-ready design

**Integrated Development Plan:**
1. Comprehensive project requirements analysis
2. Complete system architecture design
3. User interface and services development
4. Database and API development
5. Integration testing and deployment

Would you like me to help with comprehensive architecture design or review integration between layers?`
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
    <div className={`flex h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${currentRole.color} text-white`}>
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t.title}</h1>
                <p className="text-xs text-gray-500">{t.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={language === 'ar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('ar')}
            >
              العربية
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
            >
              English
            </Button>
          </div>

          {/* Role Selection */}
          <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
            <SelectTrigger className="w-full">
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

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={createNewConversation} className="flex-1">
              <FileText className="w-4 h-4 mr-1" />
              {t.newChat}
            </Button>
            <Button size="sm" variant="outline" onClick={saveCurrentConversation}>
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={clearAllHistory}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">المحادثات السابقة</h3>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  currentConversationId === conversation.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => loadConversation(conversation.id)}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded ${roleConfig[conversation.role].color} text-white`}>
                    {React.createElement(roleConfig[conversation.role].icon, { className: 'w-3 h-3' })}
                  </div>
                  <span className="text-xs font-medium">{roleConfig[conversation.role].name}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{conversation.title}</p>
                <p className="text-xs text-gray-400">{conversation.lastUpdated.toLocaleDateString('ar')}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <RoleIcon className="w-3 h-3" />
                <span>{currentRole.name}</span>
              </Badge>
              <span className="text-sm text-gray-600">{currentRole.description}</span>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t.export}
            </Button>
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
                  {t.hello} {currentRole.name}
                </h3>
                <p className="text-gray-600 mb-6">{currentRole.description}</p>
                
                {/* Examples Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h4 className="text-md font-medium text-gray-800">{t.examples}</h4>
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
                  {t.getStarted}
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
                onClick={handleSendMessage}
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md"
          multiple
        />
      </div>
    </div>
  );
};

export default ChatInterface;
