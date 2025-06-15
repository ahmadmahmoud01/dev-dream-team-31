
import { Language, AIRole } from '@/types/chat';

export const getFallbackResponse = (input: string, role: AIRole, language: Language): string => {
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
      `كمطور ويب متكام،،، سأساعدك في: ${input}

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

Would you like me to help with comprehensive architecture design or review integration between layers?`,

    'project-manager': language === 'ar' ?
      `كمدير مشروع، سأساعدك في: ${input}

**تحليل إدارة المشروع:**
- **التخطيط الاستراتيجي**: وضع خطة شاملة للمشروع مع المراحل الزمنية
- **إدارة الفريق**: تنسيق وقيادة فرق العمل المتعددة
- **مراقبة التقدم**: تتبع الإنجازات والمشاكل والمخاطر
- **التواصل**: ضمان التواصل الفعال بين جميع أصحاب المصلحة

**منهجية إدارة المشروع:**
1. تحديد نطاق المشروع والأهداف
2. تخطيط الموارد والجدول الزمني
3. تشكيل وقيادة الفريق
4. مراقبة التنفيذ والتحكم في الجودة
5. إدارة المخاطر والتغييرات

هل تريد مني مساعدتك في وضع خطة مشروع أو حل مشكلة إدارية محددة؟` :
      `As a Project Manager, I'll help you with: ${input}

**Project Management Analysis:**
- **Strategic Planning**: Comprehensive project plan with timelines
- **Team Management**: Coordination and leadership of multiple teams
- **Progress Monitoring**: Tracking achievements, issues, and risks
- **Communication**: Ensuring effective communication among all stakeholders

**Project Management Methodology:**
1. Define project scope and objectives
2. Resource and timeline planning
3. Team formation and leadership
4. Implementation monitoring and quality control
5. Risk and change management

Would you like me to help with creating a project plan or solving a specific management issue?`,

    'cost-accountant': language === 'ar' ?
      `كحساب تكاليف، سأساعدك في: ${input}

**تحليل التكاليف المالية:**
- **تقدير التكاليف**: حساب دقيق لتكاليف المشروع التقني
- **تحليل الميزانية**: مراجعة وتحليل الميزانيات المخططة والفعلية
- **تتبع الإنفاق**: مراقبة التكاليف الجارية والانحرافات
- **التقارير المالية**: إعداد تقارير مالية مفصلة للإدارة

**استراتيجية إدارة التكاليف:**
1. تحليل هيكل التكاليف للمشروع
2. وضع ميزانية تفصيلية ومرنة
3. تتبع التكاليف الفعلية مقابل المخططة
4. تحليل الانحرافات والأسباب
5. تقديم توصيات لتحسين الكفاءة المالية

هل تريد مني مساعدتك في إعداد ميزانية مشروع أو تحليل تكاليف محددة؟` :
      `As a Cost Accountant, I'll help you with: ${input}

**Financial Cost Analysis:**
- **Cost Estimation**: Accurate calculation of technical project costs
- **Budget Analysis**: Review and analysis of planned vs actual budgets
- **Expense Tracking**: Monitoring ongoing costs and variances
- **Financial Reporting**: Preparing detailed financial reports for management

**Cost Management Strategy:**
1. Project cost structure analysis
2. Detailed and flexible budget preparation
3. Tracking actual vs planned costs
4. Variance analysis and root causes
5. Recommendations for improving financial efficiency

Would you like me to help with project budget preparation or analyzing specific costs?`
  };

  return responses[role];
};
