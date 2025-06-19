// components/integrations/IntegrationCard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IntegrationConfig, TeamMember } from '@/types/integrations';
import { useIntegrations } from '@/hooks/useIntegrations';
import { CheckCircle, XCircle, Loader2, Plus, Trash2, Users, TestTube, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { azureDevOpsService } from '@/services/azureDevOpsService';

interface IntegrationCardProps {
  config: IntegrationConfig;
  language: 'ar' | 'en';
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ config, language }) => {
  const {
    settings,
    toggleAzureDevOps,
    enableAzureDevOps,
    disableAzureDevOps,
    isAzureDevOpsEnabled,
    hasValidAzureDevOpsConfig,
    getAzureDevOpsStatus,
    saveIntegrationSettings,
    testConnection,
    isLoading
  } = useIntegrations();

  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const currentSettings = settings[config.id] || { 
    enabled: false,
    personalAccessToken: '',
    organizationUrl: '',
    projectName: '',
    teamMembers: []
  };
  
  const [tempSettings, setTempSettings] = useState(currentSettings);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    email: '',
    role: 'frontend'
  });

  // Sync tempSettings when currentSettings change
  useEffect(() => {
    setTempSettings(currentSettings);
  }, [currentSettings]);

  const isAzureDevOps = config.id === 'devops';
  
  // Use Azure DevOps specific functions for devops integration
  const isEnabled = isAzureDevOps ? isAzureDevOpsEnabled() : currentSettings.enabled;
  const hasValidConfig = isAzureDevOps ? hasValidAzureDevOpsConfig() : true;

  const roleOptions = [
    { value: 'frontend', label: language === 'ar' ? 'مطور واجهة أمامية' : 'Frontend Developer' },
    { value: 'backend', label: language === 'ar' ? 'مطور خلفية' : 'Backend Developer' },
    { value: 'fullstack', label: language === 'ar' ? 'مطور متكامل' : 'Fullstack Developer' },
    { value: 'tester', label: language === 'ar' ? 'مختبر' : 'Tester' },
    { value: 'devops', label: language === 'ar' ? 'مهندس DevOps' : 'DevOps Engineer' }
  ];

  // Handle Azure DevOps toggle
  const handleAzureDevOpsToggle = (checked: boolean) => {
    if (config.id === 'devops') {
      if (checked) {
        enableAzureDevOps();
      } else {
        disableAzureDevOps();
      }
      
      toast({
        title: checked 
          ? (language === 'ar' ? 'تم تفعيل Azure DevOps' : 'Azure DevOps Enabled')
          : (language === 'ar' ? 'تم إلغاء تفعيل Azure DevOps' : 'Azure DevOps Disabled'),
        description: checked
          ? (language === 'ar' ? 'يمكنك الآن إنشاء المهام وإدارة الفريق' : 'You can now create tasks and manage team members')
          : (language === 'ar' ? 'تم إيقاف جميع وظائف Azure DevOps' : 'All Azure DevOps functions have been disabled')
      });

      // If disabling, close expanded view
      if (!checked && isExpanded) {
        setIsExpanded(false);
      }
    }
  };

  // Handle enable/disable toggle for other integrations
  const handleToggleIntegration = (checked: boolean) => {
    if (config.id === 'devops') {
      handleAzureDevOpsToggle(checked);
      return;
    }

    // For other integrations, use the generic saveIntegrationSettings
    saveIntegrationSettings(config.id, { ...currentSettings, enabled: checked });
    
    toast({
      title: checked 
        ? (language === 'ar' ? 'تم تفعيل التكامل' : 'Integration Enabled')
        : (language === 'ar' ? 'تم إلغاء تفعيل التكامل' : 'Integration Disabled'),
      description: checked
        ? (language === 'ar' ? `تم تفعيل ${config.name} بنجاح` : `${config.name} has been enabled`)
        : (language === 'ar' ? `تم إلغاء تفعيل ${config.name}` : `${config.name} has been disabled`)
    });

    // If disabling, close expanded view
    if (!checked && isExpanded) {
      setIsExpanded(false);
    }
  };

  const handleSave = () => {
    saveIntegrationSettings(config.id, tempSettings);
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Settings Saved',
      description: language === 'ar' ? 'تم حفظ إعدادات التكامل بنجاح' : 'Integration settings saved successfully'
    });
    setIsExpanded(false);
  };

  const handleTestConnection = async () => {
    if (!isAzureDevOps) return;

    if (!tempSettings.personalAccessToken || !tempSettings.organizationUrl || !tempSettings.projectName) {
      toast({
        title: language === 'ar' ? 'حقول مطلوبة' : 'Required Fields',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const result = await azureDevOpsService.testConnection({
        personalAccessToken: tempSettings.personalAccessToken,
        organizationUrl: tempSettings.organizationUrl,
        projectName: tempSettings.projectName
      });

      if (result.success) {
        setConnectionStatus('success');
        toast({
          title: language === 'ar' ? 'نجح الاتصال' : 'Connection Successful',
          description: language === 'ar' ? 'تم الاتصال بنجاح بـ Azure DevOps' : 'Successfully connected to Azure DevOps'
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: language === 'ar' ? 'فشل الاتصال' : 'Connection Failed',
          description: result.error || (language === 'ar' ? 'تحقق من الإعدادات' : 'Please check your settings'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: language === 'ar' ? 'خطأ في الاتصال' : 'Connection Error',
        description: language === 'ar' ? 'حدث خطأ أثناء اختبار الاتصال' : 'An error occurred while testing connection',
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Azure DevOps team member management
  const addTeamMember = () => {
    if (newMember.email && newMember.role) {
      const member: TeamMember = {
        id: Date.now().toString(),
        email: newMember.email,
        role: newMember.role as TeamMember['role'],
        displayName: newMember.email.split('@')[0]
      };

      const updatedMembers = [...(tempSettings.teamMembers || []), member];
      setTempSettings({
        ...tempSettings,
        teamMembers: updatedMembers
      });

      setNewMember({ email: '', role: 'frontend' });
    }
  };

  const removeTeamMember = (id: string) => {
    const updatedMembers = (tempSettings.teamMembers || []).filter(member => member.id !== id);
    setTempSettings({
      ...tempSettings,
      teamMembers: updatedMembers
    });
  };

  const getStatusIcon = () => {
    if (isLoading || testingConnection) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (connectionStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (connectionStatus === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.color} text-white text-xl`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{config.name}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
            
            {/* Azure DevOps team members summary */}
            {isAzureDevOps && currentSettings.teamMembers && currentSettings.teamMembers.length > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {currentSettings.teamMembers.length} {language === 'ar' ? 'عضو فريق' : 'team members'}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge variant={isEnabled && hasValidConfig ? 'default' : 'secondary'}>
            {isEnabled 
              ? (hasValidConfig 
                  ? (language === 'ar' ? 'مفعل' : 'Active')
                  : (language === 'ar' ? 'يتطلب إعداد' : 'Needs Setup'))
              : (language === 'ar' ? 'معطل' : 'Disabled')
            }
          </Badge>
        </div>
      </div>

      {/* Main Toggle and Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleIntegration}
            disabled={isLoading}
          />
          <Label className="font-medium">
            {language === 'ar' ? 'تفعيل التكامل' : 'Enable Integration'}
          </Label>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!isEnabled}
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </Button>
      </div>

      {/* Configuration Panel - Only show when enabled and expanded */}
      {isEnabled && isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {isAzureDevOps ? (
            <>
              {/* Azure DevOps Configuration */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'رمز الوصول الشخصي' : 'Personal Access Token'}</Label>
                <Input
                  type="password"
                  value={tempSettings.personalAccessToken || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, personalAccessToken: e.target.value })}
                  placeholder={language === 'ar' ? 'أدخل رمز الوصول الشخصي...' : 'Enter your PAT...'}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'رابط المؤسسة' : 'Organization URL'}</Label>
                <Input
                  value={tempSettings.organizationUrl || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, organizationUrl: e.target.value })}
                  placeholder="https://dev.azure.com/your-organization"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اسم المشروع' : 'Project Name'}</Label>
                <Input
                  value={tempSettings.projectName || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, projectName: e.target.value })}
                  placeholder={language === 'ar' ? 'اسم المشروع' : 'Project name'}
                />
              </div>

              {/* Team Members Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <Label className="text-base font-medium">
                    {language === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                  </Label>
                </div>

                {/* Add New Member */}
                <div className="flex gap-2">
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
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(tempSettings.teamMembers || []).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-sm">{member.email}</div>
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
                  
                  {(!tempSettings.teamMembers || tempSettings.teamMembers.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {language === 'ar' ? 'لم يتم إضافة أعضاء فريق بعد' : 'No team members added yet'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {language === 'ar' ? 'إعدادات التكامل ستظهر هنا' : 'Integration settings will appear here'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button onClick={handleSave} size="sm">
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            {isAzureDevOps && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testingConnection}
                size="sm"
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {testingConnection
                  ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...')
                  : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')
                }
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              size="sm"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default IntegrationCard;
