
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Language, AIRole } from '@/types/chat';
import { CheckSquare, User, Clock, Target, Lightbulb, FileText, Users, Zap } from 'lucide-react';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  suggestedAgent: AIRole;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  category: 'analysis' | 'development' | 'testing' | 'documentation';
}

interface ProductManagerTaskTemplatesProps {
  language: Language;
  onAssignTask: (template: TaskTemplate) => void;
  availableAgents: Array<{ id: string; name: string; role: AIRole; isActive: boolean }>;
}

const ProductManagerTaskTemplates: React.FC<ProductManagerTaskTemplatesProps> = ({
  language,
  onAssignTask,
  availableAgents
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const taskTemplates: TaskTemplate[] = [
    // Analysis Tasks
    {
      id: 'req-analysis',
      title: language === 'ar' ? 'تحليل المتطلبات' : 'Requirements Analysis',
      description: language === 'ar' 
        ? 'تحليل وتوثيق متطلبات المشروع الجديد' 
        : 'Analyze and document new project requirements',
      suggestedAgent: 'business-analyst',
      priority: 'high',
      estimatedTime: '2-3 hours',
      category: 'analysis'
    },
    {
      id: 'user-story',
      title: language === 'ar' ? 'كتابة قصص المستخدم' : 'Write User Stories',
      description: language === 'ar' 
        ? 'إنشاء قصص مستخدم مفصلة للميزات الجديدة' 
        : 'Create detailed user stories for new features',
      suggestedAgent: 'product-manager',
      priority: 'high',
      estimatedTime: '1-2 hours',
      category: 'analysis'
    },
    
    // Development Tasks  
    {
      id: 'ui-component',
      title: language === 'ar' ? 'تطوير مكونات الواجهة' : 'Develop UI Components',
      description: language === 'ar' 
        ? 'إنشاء مكونات واجهة المستخدم القابلة لإعادة الاستخدام' 
        : 'Create reusable UI components',
      suggestedAgent: 'frontend',
      priority: 'medium',
      estimatedTime: '3-4 hours',
      category: 'development'
    },
    {
      id: 'api-integration',
      title: language === 'ar' ? 'تكامل API' : 'API Integration',
      description: language === 'ar' 
        ? 'دمج واجهات برمجة التطبيقات الخارجية' 
        : 'Integrate external APIs',
      suggestedAgent: 'backend',
      priority: 'high',
      estimatedTime: '2-3 hours',
      category: 'development'
    },
    {
      id: 'mobile-responsive',
      title: language === 'ar' ? 'التصميم المتجاوب للجوال' : 'Mobile Responsive Design',
      description: language === 'ar' 
        ? 'تحسين التطبيق للأجهزة المحمولة' 
        : 'Optimize application for mobile devices',
      suggestedAgent: 'mobile',
      priority: 'medium',
      estimatedTime: '2-3 hours',
      category: 'development'
    },

    // Testing Tasks
    {
      id: 'test-cases',
      title: language === 'ar' ? 'كتابة حالات الاختبار' : 'Write Test Cases',
      description: language === 'ar' 
        ? 'إنشاء حالات اختبار شاملة للميزات الجديدة' 
        : 'Create comprehensive test cases for new features',
      suggestedAgent: 'tester',
      priority: 'medium',
      estimatedTime: '1-2 hours',
      category: 'testing'
    },
    {
      id: 'automation-tests',
      title: language === 'ar' ? 'اختبارات آلية' : 'Automated Testing',
      description: language === 'ar' 
        ? 'تطوير اختبارات آلية للتطبيق' 
        : 'Develop automated tests for the application',
      suggestedAgent: 'tester',
      priority: 'low',
      estimatedTime: '3-4 hours',
      category: 'testing'
    },

    // Documentation Tasks
    {
      id: 'api-docs',
      title: language === 'ar' ? 'توثيق API' : 'API Documentation',
      description: language === 'ar' 
        ? 'إنشاء توثيق تفصيلي لواجهات برمجة التطبيقات' 
        : 'Create detailed API documentation',
      suggestedAgent: 'backend',
      priority: 'medium',
      estimatedTime: '1-2 hours',
      category: 'documentation'
    },
    {
      id: 'user-guide',
      title: language === 'ar' ? 'دليل المستخدم' : 'User Guide',
      description: language === 'ar' 
        ? 'كتابة دليل شامل للمستخدم النهائي' 
        : 'Write comprehensive end-user guide',
      suggestedAgent: 'business-analyst',
      priority: 'low',
      estimatedTime: '2-3 hours',
      category: 'documentation'
    }
  ];

  const categories = [
    { id: 'all', name: language === 'ar' ? 'الكل' : 'All', icon: Target },
    { id: 'analysis', name: language === 'ar' ? 'تحليل' : 'Analysis', icon: Lightbulb },
    { id: 'development', name: language === 'ar' ? 'تطوير' : 'Development', icon: Zap },
    { id: 'testing', name: language === 'ar' ? 'اختبار' : 'Testing', icon: CheckSquare },
    { id: 'documentation', name: language === 'ar' ? 'توثيق' : 'Documentation', icon: FileText }
  ];

  const filteredTasks = selectedCategory === 'all' 
    ? taskTemplates 
    : taskTemplates.filter(task => task.category === selectedCategory);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'bg-purple-100 text-purple-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-orange-100 text-orange-800';
      case 'documentation': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableAgentForRole = (role: AIRole) => {
    return availableAgents.find(agent => agent.role === role && agent.isActive);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'قوالب المهام الجاهزة' : 'Ready Task Templates'}
          </h3>
          <p className="text-sm text-gray-600">
            {language === 'ar' 
              ? 'اختر مهمة وقم بتعيينها لأحد الوكلاء المتاحين' 
              : 'Select a task and assign it to an available agent'
            }
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {language === 'ar' ? 'وكلاء متاحين' : 'Available Agents'}: {availableAgents.filter(a => a.isActive).length}
        </Badge>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center space-x-1"
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Task Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((template) => {
          const suggestedAgent = getAvailableAgentForRole(template.suggestedAgent);
          
          return (
            <Card key={template.id} className="p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {template.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </p>
                </div>
                <Badge className={getPriorityColor(template.priority)}>
                  {language === 'ar' 
                    ? (template.priority === 'high' ? 'عالية' : template.priority === 'medium' ? 'متوسطة' : 'منخفضة')
                    : template.priority
                  }
                </Badge>
              </div>

              {/* Task Details */}
              <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{template.estimatedTime}</span>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(template.category)}>
                    {categories.find(c => c.id === template.category)?.name}
                  </Badge>
                </div>
              </div>

              {/* Suggested Agent */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {language === 'ar' ? 'الوكيل المقترح:' : 'Suggested Agent:'}
                  </span>
                  {suggestedAgent ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {suggestedAgent.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {language === 'ar' ? 'غير متاح' : 'Not Available'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t">
                <Button 
                  onClick={() => onAssignTask(template)}
                  className="w-full"
                  disabled={!suggestedAgent}
                >
                  <Users className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'تعيين المهمة' : 'Assign Task'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {language === 'ar' ? 'لا توجد مهام في هذه الفئة' : 'No tasks in this category'}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'ar' 
              ? 'جرب اختيار فئة أخرى' 
              : 'Try selecting a different category'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductManagerTaskTemplates;
