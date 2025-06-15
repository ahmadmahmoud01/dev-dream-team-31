
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Language, AIRole } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { Users, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import RoleEditor from './RoleEditor';
import ExampleQuestionEditor from './ExampleQuestionEditor';

interface RoleManagementPanelProps {
  language: Language;
}

const RoleManagementPanel: React.FC<RoleManagementPanelProps> = ({ language }) => {
  const [selectedRole, setSelectedRole] = useState<AIRole>('tester');
  const [showAddRole, setShowAddRole] = useState(false);
  const roleConfig = getRoleConfig(language);
  const { customRoles, addCustomRole, updateRole, deleteRole } = useRoleManagement();

  const allRoles = { ...roleConfig, ...customRoles };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الموظفين' : 'Role Management'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'قم بإدارة الموظفين وتعديل أسئلتهم'
                : 'Manage roles and customize their questions'
              }
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowAddRole(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {language === 'ar' ? 'إضافة موظف' : 'Add Role'}
        </Button>
      </div>

      {/* Overview Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(roleConfig).length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'الموظفين الافتراضيين' : 'Default Roles'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(customRoles).length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'الموظفين المخصصين' : 'Custom Roles'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(allRoles).reduce((total, role) => total + (role.examples?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'إجمالي الأسئلة' : 'Total Questions'}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">
            {language === 'ar' ? 'الموظفين' : 'Roles'}
          </TabsTrigger>
          <TabsTrigger value="questions">
            {language === 'ar' ? 'الأسئلة' : 'Questions'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(allRoles).map(([roleId, role]) => {
              const Icon = role.icon;
              const isCustom = !roleConfig[roleId as AIRole];
              
              return (
                <Card key={roleId} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${role.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{role.name}</h3>
                        {isCustom && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {language === 'ar' ? 'مخصص' : 'Custom'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(roleId as AIRole)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(roleId as AIRole)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {role.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {language === 'ar' ? 'الأسئلة:' : 'Questions:'} {role.examples?.length || 0}
                    </span>
                    <span className={isCustom ? 'text-blue-600' : 'text-gray-500'}>
                      {isCustom ? (language === 'ar' ? 'مخصص' : 'Custom') : (language === 'ar' ? 'افتراضي' : 'Default')}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Add Role Modal */}
          {showAddRole && (
            <RoleEditor
              language={language}
              onSave={(newRole) => {
                addCustomRole(newRole);
                setShowAddRole(false);
              }}
              onCancel={() => setShowAddRole(false)}
            />
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <ExampleQuestionEditor
            language={language}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            allRoles={allRoles}
            onUpdateRole={updateRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleManagementPanel;
