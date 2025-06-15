
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language } from '@/types/chat';
import { RoleConfig } from '@/config/roleConfig';
import { Save, X, Palette } from 'lucide-react';
import * as Icons from 'lucide-react';

interface RoleEditorProps {
  language: Language;
  onSave: (role: RoleConfig & { id?: string }) => void;
  onCancel: () => void;
  initialData?: RoleConfig & { id?: string };
}

const RoleEditor: React.FC<RoleEditorProps> = ({
  language,
  onSave,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    color: initialData?.color || 'bg-blue-500',
    icon: initialData?.icon?.name || 'User',
    examples: initialData?.examples?.join('\n') || ''
  });

  const colorOptions = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500',
    'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'
  ];

  const iconOptions = [
    'User', 'Users', 'UserCheck', 'Code', 'Database', 'Server',
    'Smartphone', 'Settings', 'BarChart3', 'Calculator', 'TestTube',
    'Briefcase', 'Zap', 'Shield', 'Globe', 'Monitor'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const IconComponent = (Icons as any)[formData.icon] || Icons.User;
    const examples = formData.examples.split('\n').filter(q => q.trim());
    
    onSave({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: IconComponent,
      examples,
      ...(initialData?.id && { id: initialData.id })
    });
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {language === 'ar' 
            ? (initialData ? 'تعديل الموظف' : 'إضافة موظف جديد')
            : (initialData ? 'Edit Role' : 'Add New Role')
          }
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'ar' ? 'اسم الموظف' : 'Role Name'}
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={language === 'ar' ? 'أدخل اسم الموظف' : 'Enter role name'}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'ar' ? 'الوصف' : 'Description'}
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={language === 'ar' ? 'وصف الموظف ومهامه' : 'Role description and responsibilities'}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === 'ar' ? 'اللون' : 'Color'}
            </label>
            <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${formData.color}`} />
                    <span>{formData.color}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded ${color}`} />
                      <span>{color}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {language === 'ar' ? 'الأيقونة' : 'Icon'}
            </label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {React.createElement((Icons as any)[formData.icon] || Icons.User, { className: 'w-4 h-4' })}
                    <span>{formData.icon}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center space-x-2">
                      {React.createElement((Icons as any)[icon], { className: 'w-4 h-4' })}
                      <span>{icon}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'ar' ? 'أسئلة الأمثلة (سطر واحد لكل سؤال)' : 'Example Questions (one per line)'}
          </label>
          <Textarea
            value={formData.examples}
            onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
            placeholder={language === 'ar' ? 'أدخل أسئلة الأمثلة، سؤال واحد في كل سطر' : 'Enter example questions, one per line'}
            rows={6}
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-1" />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RoleEditor;
