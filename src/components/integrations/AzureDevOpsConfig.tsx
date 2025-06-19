// components/integrations/AzureDevOpsConfig.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TestTube, CheckCircle, XCircle, Users } from 'lucide-react';
import { Language } from '@/types/chat';
import type{ TeamMember, AzureDevOpsConfig } from '@/types/integrations';
import { azureDevOpsService } from '@/services/azureDevOpsService';

interface AzureDevOpsConfigProps {
  language: Language;
  config: AzureDevOpsConfig;
  onConfigChange: (config: AzureDevOpsConfig) => void;
  onSave: () => void;
}

const AzureDevOpsConfig: React.FC<AzureDevOpsConfigProps> = ({
  language,
  config,
  onConfigChange,
  onSave
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    email: '',
    role: 'frontend'
  });

  const roleOptions = [
    { value: 'frontend', label: language === 'ar' ? 'مطور واجهة أمامية' : 'Frontend Developer' },
    { value: 'backend', label: language === 'ar' ? 'مطور خلفية' : 'Backend Developer' },
    { value: 'fullstack', label: language === 'ar' ? 'مطور متكامل' : 'Fullstack Developer' },
    { value: 'tester', label: language === 'ar' ? 'مختبر' : 'Tester' },
    { value: 'devops', label: language === 'ar' ? 'مهندس DevOps' : 'DevOps Engineer' }
  ];

  const addTeamMember = () => {
    if (newMember.email && newMember.role) {
      const member: TeamMember = {
        id: Date.now().toString(),
        email: newMember.email,
        role: newMember.role as TeamMember['role'],
        displayName: newMember.email.split('@')[0]
      };

      onConfigChange({
        ...config,
        teamMembers: [...config.teamMembers, member]
      });

      setNewMember({ email: '', role: 'frontend' });
    }
  };

  const removeTeamMember = (id: string) => {
    onConfigChange({
      ...config,
      teamMembers: config.teamMembers.filter(member => member.id !== id)
    });
  };

  const testConnection = async () => {
    if (!config.personalAccessToken || !config.organizationUrl || !config.projectName) {
      setTestStatus('error');
      setTestMessage(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setTestStatus('testing');
    setTestMessage(language === 'ar' ? 'جاري اختبار الاتصال...' : 'Testing connection...');

    try {
      const result = await azureDevOpsService.testConnection({
        personalAccessToken: config.personalAccessToken,
        organizationUrl: config.organizationUrl,
        projectName: config.projectName
      });

      if (result.success) {
        setTestStatus('success');
        setTestMessage(language === 'ar' ? 'تم الاتصال بنجاح!' : 'Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(result.error || (language === 'ar' ? 'فشل في الاتصال' : 'Connection failed'));
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(language === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ⚙️ {language === 'ar' ? 'إعدادات Azure DevOps' : 'Azure DevOps Configuration'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pat">
              {language === 'ar' ? 'رمز الوصول الشخصي' : 'Personal Access Token'}
            </Label>
            <Input
              id="pat"
              type="password"
              value={config.personalAccessToken}
              onChange={(e) => onConfigChange({
                ...config,
                personalAccessToken: e.target.value
              })}
              placeholder={language === 'ar' ? 'أدخل رمز الوصول الشخصي' : 'Enter your PAT'}
            />
          </div>

          <div>
            <Label htmlFor="orgUrl">
              {language === 'ar' ? 'رابط المؤسسة' : 'Organization URL'}
            </Label>
            <Input
              id="orgUrl"
              value={config.organizationUrl}
              onChange={(e) => onConfigChange({
                ...config,
                organizationUrl: e.target.value
              })}
              placeholder="https://dev.azure.com/your-organization"
            />
          </div>

          <div>
            <Label htmlFor="project">
              {language === 'ar' ? 'اسم المشروع' : 'Project Name'}
            </Label>
            <Input
              id="project"
              value={config.projectName}
              onChange={(e) => onConfigChange({
                ...config,
                projectName: e.target.value
              })}
              placeholder={language === 'ar' ? 'اسم المشروع' : 'Project name'}
            />
          </div>
        </div>
      </Card>

      {/* Team Members Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
        </h3>

        {/* Add New Member */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
            />
          </div>
          <div className="w-48">
            <Select
              value={newMember.role}
              onValueChange={(value) => setNewMember({ ...newMember, role: value as TeamMember['role'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addTeamMember} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Team Members List */}
        <div className="space-y-2">
          {config.teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{member.email}</div>
                  <Badge variant="secondary" className="text-xs">
                    {roleOptions.find(r => r.value === member.role)?.label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTeamMember(member.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {config.teamMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {language === 'ar' ? 'لم يتم إضافة أعضاء فريق بعد' : 'No team members added yet'}
            </div>
          )}
        </div>
      </Card>

      {/* Test Connection & Save */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {testStatus === 'testing' 
                ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...')
                : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')
              }
            </Button>

            {testStatus !== 'idle' && (
              <div className="flex items-center gap-2">
                {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {testStatus === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                <span className={`text-sm ${
                  testStatus === 'success' ? 'text-green-600' : 
                  testStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {testMessage}
                </span>
              </div>
            )}
          </div>

          <Button onClick={onSave} className="flex items-center gap-2">
            {language === 'ar' ? 'حفظ الإعدادات' : 'Save Configuration'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AzureDevOpsConfig;
