
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Language, AIRole } from '@/types/chat';
import { RoleConfig } from '@/config/roleConfig';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface ExampleQuestionEditorProps {
  language: Language;
  selectedRole: AIRole;
  onRoleChange: (role: AIRole) => void;
  allRoles: Record<string, RoleConfig>;
  onUpdateRole: (roleId: string, updates: Partial<RoleConfig>) => void;
}

const ExampleQuestionEditor: React.FC<ExampleQuestionEditorProps> = ({
  language,
  selectedRole,
  onRoleChange,
  allRoles,
  onUpdateRole
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingQuestion, setEditingQuestion] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const currentRole = allRoles[selectedRole];
  const examples = currentRole?.examples || [];

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const updatedExamples = [...examples, newQuestion.trim()];
      onUpdateRole(selectedRole, { examples: updatedExamples });
      setNewQuestion('');
      setShowAddForm(false);
    }
  };

  const handleEditQuestion = (index: number) => {
    if (editingQuestion.trim()) {
      const updatedExamples = [...examples];
      updatedExamples[index] = editingQuestion.trim();
      onUpdateRole(selectedRole, { examples: updatedExamples });
      setEditingIndex(null);
      setEditingQuestion('');
    }
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedExamples = examples.filter((_, i) => i !== index);
    onUpdateRole(selectedRole, { examples: updatedExamples });
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingQuestion(examples[index]);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingQuestion('');
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'إدارة أسئلة الأمثلة' : 'Manage Example Questions'}
          </h3>
          <Select value={selectedRole} onValueChange={(value) => onRoleChange(value as AIRole)}>
            <SelectTrigger className="w-64">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  {currentRole && React.createElement(currentRole.icon, { className: 'w-4 h-4' })}
                  <span>{currentRole?.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(allRoles).map(([roleId, role]) => (
                <SelectItem key={roleId} value={roleId}>
                  <div className="flex items-center space-x-2">
                    {React.createElement(role.icon, { className: 'w-4 h-4' })}
                    <span>{role.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {examples.length} {language === 'ar' ? 'سؤال' : 'questions'}
            </Badge>
            <span className="text-sm text-gray-500">
              {language === 'ar' ? 'للموظف:' : 'for role:'} {currentRole?.name}
            </span>
          </div>
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {language === 'ar' ? 'إضافة سؤال' : 'Add Question'}
          </Button>
        </div>
      </Card>

      {/* Add New Question Form */}
      {showAddForm && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {language === 'ar' ? 'إضافة سؤال جديد' : 'Add New Question'}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل السؤال الجديد...' : 'Enter new question...'}
              rows={2}
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddQuestion} size="sm">
                <Save className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {examples.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">❓</div>
              <p>
                {language === 'ar' 
                  ? 'لا توجد أسئلة أمثلة لهذا الموظف'
                  : 'No example questions for this role'
                }
              </p>
            </div>
          </Card>
        ) : (
          examples.map((question, index) => (
            <Card key={index} className="p-4">
              {editingIndex === index ? (
                <div className="space-y-3">
                  <Textarea
                    value={editingQuestion}
                    onChange={(e) => setEditingQuestion(e.target.value)}
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEditQuestion(index)} size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm">{question}</p>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExampleQuestionEditor;
