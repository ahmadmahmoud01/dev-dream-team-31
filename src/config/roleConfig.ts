
import { TestTube, Code, BarChart3, Server, Smartphone, Settings, Database } from 'lucide-react';
import { AIRole, Language } from '@/types/chat';

export interface RoleConfig {
  name: string;
  icon: any;
  color: string;
  description: string;
  examples: string[];
}

export const getRoleConfig = (language: Language): Record<AIRole, RoleConfig> => {
  const translations = {
    ar: {
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
    },
    en: {
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
    }
  };

  const t = translations[language];

  return {
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
};
