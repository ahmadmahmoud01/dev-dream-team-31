// components/chat/AzureDevOpsPrompt.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Users, CheckCircle, AlertCircle, Briefcase, Target, FileText } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { azureDevOpsService } from '@/services/azureDevOpsService';
import { useToast } from '@/hooks/use-toast';

interface AzureDevOpsPromptProps {
  language: 'ar' | 'en';
  onResponse: (response: 'yes' | 'no') => void;
  onTasksCreated: (result: any) => void;
  onError: (error: string) => void;
}

const AzureDevOpsPrompt: React.FC<AzureDevOpsPromptProps> = ({
  language,
  onResponse,
  onTasksCreated,
  onError
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const { settings, isAzureDevOpsEnabled, hasValidAzureDevOpsConfig } = useIntegrations();
  const { toast } = useToast();

  const azureDevOpsConfig = settings.devops;
  const teamMembers = azureDevOpsConfig?.teamMembers || [];

  const handleYesClick = () => {
    if (!isAzureDevOpsEnabled() || !hasValidAzureDevOpsConfig()) {
      toast({
        title: language === 'ar' ? 'Azure DevOps غير مكون' : 'Azure DevOps Not Configured',
        description: language === 'ar' 
          ? 'يرجى تكوين Azure DevOps في صفحة التكاملات أولاً'
          : 'Please configure Azure DevOps in the integrations page first',
        variant: 'destructive'
      });
      return;
    }

    if (teamMembers.length === 0) {
      toast({
        title: language === 'ar' ? 'لا توجد أعضاء فريق' : 'No Team Members',
        description: language === 'ar'
          ? 'يرجى إضافة أعضاء الفريق في إعدادات Azure DevOps'
          : 'Please add team members in Azure DevOps settings',
        variant: 'destructive'
      });
      return;
    }

    setShowFileUpload(true);
    onResponse('yes');
  };

  const handleNoClick = () => {
    onResponse('no');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const validExtensions = ['.docx', '.doc'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    const isPRDFile = file.name.toLowerCase().includes('prd');

    if (!hasValidExtension || !isPRDFile) {
      toast({
        title: language === 'ar' ? 'نوع ملف غير صحيح' : 'Invalid File Type',
        description: language === 'ar'
          ? 'يرجى تحميل ملف PRD المُولد بصيغة .docx أو .doc'
          : 'Please upload the generated PRD document in .docx or .doc format',
        variant: 'destructive'
      });
      return;
    }

    // Add debug logging
    console.log('=== AZURE DEVOPS TASK CREATION ===');
    console.log('File uploaded:', file.name);
    console.log('Team members:', teamMembers.length);
    console.log('Azure DevOps Config:', {
      project: azureDevOpsConfig.projectName,
      org: azureDevOpsConfig.organizationUrl,
      hasToken: !!azureDevOpsConfig.personalAccessToken
    });
    console.log('=== STARTING TASK CREATION ===');

    setIsCreatingTasks(true);

    try {
      // Create tasks directly without file processing through PRD pipeline
      const result = await azureDevOpsService.createTasksFromPRD(
        {
          personalAccessToken: azureDevOpsConfig.personalAccessToken,
          organizationUrl: azureDevOpsConfig.organizationUrl,
          projectName: azureDevOpsConfig.projectName
        },
        file.name,
        teamMembers.map(member => ({
          email: member.email,
          role: member.role
        }))
      );

      console.log('Task creation result:', result);

      if (result.success) {
        onTasksCreated(result);
        toast({
          title: language === 'ar' ? 'تم إنشاء المهام بنجاح' : 'Work Items Created Successfully',
          description: language === 'ar'
            ? `تم إنشاء ${result.createdTasks?.length || 0} عنصر عمل في Azure DevOps`
            : `Created ${result.createdTasks?.length || 0} work items in Azure DevOps`
        });
      } else {
        throw new Error(result.error || 'Failed to create work items');
      }
    } catch (error) {
      console.error('Task creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError(errorMessage);
      toast({
        title: language === 'ar' ? 'فشل في إنشاء المهام' : 'Failed to Create Work Items',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsCreatingTasks(false);
    }
  };

  if (showFileUpload) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-4">
          {/* Clear Header for Task Creation */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">
                {language === 'ar' ? 'إنشاء عناصر عمل Azure DevOps' : 'Create Azure DevOps Work Items'}
              </h4>
              <p className="text-sm text-blue-600">
                {language === 'ar' ? 'تحويل PRD إلى مهام قابلة للتنفيذ' : 'Convert PRD to actionable tasks'}
              </p>
            </div>
          </div>
          
          {/* Clear Action Description */}
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-gray-700">
                {language === 'ar'
                  ? 'سيتم استخدام مستند PRD كمرجع لإنشاء مهام عمل مخصصة لكل عضو في الفريق بناءً على دوره'
                  : 'The PRD document will be used as reference to create customized work items for each team member based on their role'
                }
              </p>
            </div>
          </div>

          {/* Project and Team Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-100 p-2 rounded">
              <span className="font-medium text-blue-800">
                {language === 'ar' ? 'المشروع:' : 'Project:'}
              </span>
              <div className="text-blue-700 truncate">{azureDevOpsConfig?.projectName}</div>
            </div>
            <div className="bg-blue-100 p-2 rounded">
              <span className="font-medium text-blue-800">
                {language === 'ar' ? 'أعضاء الفريق:' : 'Team Members:'}
              </span>
              <div className="text-blue-700">{teamMembers.length} configured</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Users className="w-4 h-4" />
            <span>
              {language === 'ar'
                ? `سيتم إنشاء وتعيين مهام لـ ${teamMembers.length} عضو فريق`
                : `Work items will be created and assigned to ${teamMembers.length} team members`
              }
            </span>
          </div>

          {/* Enhanced File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-800">
              {language === 'ar' ? 'تحميل مستند PRD' : 'Upload PRD Document'}
            </label>
            <input
              type="file"
              accept=".docx,.doc"
              onChange={handleFileUpload}
              disabled={isCreatingTasks}
              className="block w-full text-sm text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            <p className="text-xs text-blue-600">
              {language === 'ar'
                ? 'سيتم استخدام هذا الملف كمرجع لإنشاء المهام، لن يتم معالجته كمتطلبات جديدة'
                : 'This file will be used as reference for task creation, not processed as new requirements'
              }
            </p>
          </div>

          {isCreatingTasks && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>
                {language === 'ar' ? 'جاري إنشاء عناصر العمل...' : 'Creating work items...'}
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-4">
        {/* Clear Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">
              {language === 'ar' ? 'إنشاء مهام Azure DevOps' : 'Create Azure DevOps Tasks'}
            </h4>
            <p className="text-sm text-blue-600">
              {language === 'ar' ? 'تحويل PRD إلى عناصر عمل' : 'Convert PRD to work items'}
            </p>
          </div>
        </div>
        
        {/* Clear Action Description */}
        <div className="bg-white p-3 rounded border border-blue-200">
          <p className="text-sm text-gray-700">
            {language === 'ar'
              ? 'هل تريد إنشاء عناصر عمل في مشروع Azure DevOps وتعيينها لأعضاء الفريق بناءً على أدوارهم؟'
              : 'Do you want to create work items in your Azure DevOps project and assign them to team members based on their roles?'
            }
          </p>
        </div>

        {/* Project Information */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-100 p-2 rounded">
            <span className="font-medium text-blue-800">
              {language === 'ar' ? 'المشروع:' : 'Project:'}
            </span>
            <div className="text-blue-700 truncate">{azureDevOpsConfig?.projectName}</div>
          </div>
          <div className="bg-blue-100 p-2 rounded">
            <span className="font-medium text-blue-800">
              {language === 'ar' ? 'المؤسسة:' : 'Organization:'}
            </span>
            <div className="text-blue-700 truncate">
              {azureDevOpsConfig?.organizationUrl?.replace('https://dev.azure.com/', '')}
            </div>
          </div>
        </div>

        {/* Team Members Preview */}
        {teamMembers.length > 0 && (
          <div className="text-xs text-blue-600">
            <strong className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {language === 'ar' ? 'أعضاء الفريق المكونين:' : 'Configured Team Members:'}
            </strong>
            <div className="mt-2 space-y-1">
              {teamMembers.slice(0, 3).map((member, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-2 rounded">
                  <span className="text-blue-700">{member.email}</span>
                  <span className="text-xs bg-blue-100 px-2 py-1 rounded font-medium">
                    {member.role}
                  </span>
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="text-xs text-blue-500 bg-white p-2 rounded">
                  {language === 'ar' 
                    ? `و ${teamMembers.length - 3} أعضاء آخرين...`
                    : `and ${teamMembers.length - 3} more members...`
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning if not configured */}
        {(!isAzureDevOpsEnabled() || !hasValidAzureDevOpsConfig() || teamMembers.length === 0) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-700">
              {language === 'ar'
                ? 'يرجى تكوين Azure DevOps وإضافة أعضاء الفريق في صفحة التكاملات أولاً'
                : 'Please configure Azure DevOps and add team members in the integrations page first'
              }
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleYesClick}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {language === 'ar' ? 'إنشاء المهام' : 'Create Tasks'}
          </Button>
          <Button
            onClick={handleNoClick}
            variant="outline"
            size="sm"
          >
            {language === 'ar' ? 'تخطي' : 'Skip'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AzureDevOpsPrompt;
