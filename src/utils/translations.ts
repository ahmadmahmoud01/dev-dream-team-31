
import { Language } from '@/types/chat';

export const getTranslations = (language: Language) => ({
  ar: {
    title: 'GPT Mate',
    subtitle: 'مساعد الذكي لتطوير البرمجيات',
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
}[language]);
