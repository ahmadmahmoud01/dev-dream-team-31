import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Language, AIRole } from '@/types/chat';
import { getRoleConfig } from '@/config/roleConfig';
import { useAgentManagement } from '@/hooks/useAgentManagement';
import { Bot, Plus, Play, Pause, Trash2, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';
import ProductManagerTaskTemplates from './ProductManagerTaskTemplates';

interface AgentManagementPanelProps {
  language: Language;
}

const AgentManagementPanel: React.FC<AgentManagementPanelProps> = ({ language }) => {
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState<AIRole>('frontend');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const roleConfig = getRoleConfig(language);
  const {
    agents,
    tasks,
    selectedAgent,
    setSelectedAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    createTask,
    assignTask,
    completeTask,
    getAgentTasks,
    getAvailableAgents
  } = useAgentManagement();

  const handleCreateAgent = () => {
    if (newAgentName.trim() && newAgentDescription.trim()) {
      createAgent(newAgentName, newAgentRole, newAgentDescription);
      setNewAgentName('');
      setNewAgentDescription('');
      setShowCreateAgent(false);
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim() && newTaskDescription.trim()) {
      createTask(newTaskTitle, newTaskDescription, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowCreateTask(false);
    }
  };

  const handleAssignTaskTemplate = (template: any) => {
    const taskId = createTask(template.title, template.description, template.priority);
    const suggestedAgent = getAvailableAgents().find(agent => agent.role === template.suggestedAgent);
    
    if (suggestedAgent && taskId) {
      assignTask(taskId, suggestedAgent.id);
      console.log(`Task "${template.title}" assigned to agent "${suggestedAgent.name}"`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الوكلاء الذكيين' : 'AI Agent Management'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'قم بإنشاء وإدارة الوكلاء الذكيين لمعالجة مهام المشروع'
                : 'Create and manage AI agents to handle project tasks'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {agents.length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'إجمالي الوكلاء' : 'Total Agents'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {agents.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'الوكلاء النشطين' : 'Active Agents'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'المهام المكتملة' : 'Completed Tasks'}
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            <Target className="w-4 h-4 mr-1" />
            {language === 'ar' ? 'قوالب المهام' : 'Task Templates'}
          </TabsTrigger>
          <TabsTrigger value="agents">
            {language === 'ar' ? 'الوكلاء' : 'Agents'}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {language === 'ar' ? 'المهام' : 'Tasks'}
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <ProductManagerTaskTemplates
            language={language}
            onAssignTask={handleAssignTaskTemplate}
            availableAgents={getAvailableAgents()}
          />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {language === 'ar' ? 'الوكلاء الذكيين' : 'AI Agents'}
            </h2>
            <Button onClick={() => setShowCreateAgent(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'إضافة وكيل' : 'Add Agent'}
            </Button>
          </div>

          {/* Create Agent Form */}
          {showCreateAgent && (
            <Card className="p-4">
              <div className="space-y-4">
                <Input
                  placeholder={language === 'ar' ? 'اسم الوكيل' : 'Agent Name'}
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                />
                <select
                  className="w-full p-2 border rounded-md"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value as AIRole)}
                >
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>
                <Textarea
                  placeholder={language === 'ar' ? 'وصف الوكيل ومهامه' : 'Agent description and responsibilities'}
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateAgent}>
                    {language === 'ar' ? 'إنشاء' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateAgent(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const roleInfo = roleConfig[agent.role];
              const Icon = roleInfo.icon;
              const agentTasks = getAgentTasks(agent.id);
              
              return (
                <Card key={agent.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${roleInfo.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{roleInfo.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateAgent(agent.id, { isActive: !agent.isActive })}
                      >
                        {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAgent(agent.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                      {agent.isActive 
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : (language === 'ar' ? 'متوقف' : 'Inactive')
                      }
                    </Badge>
                    <span className="text-gray-500">
                      {language === 'ar' ? 'المهام' : 'Tasks'}: {agentTasks.length}
                    </span>
                  </div>

                  {agent.currentTask && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <span className="text-blue-600">
                        {language === 'ar' ? 'المهمة الحالية' : 'Current Task'}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {language === 'ar' ? 'مهام المشروع' : 'Project Tasks'}
            </h2>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'إضافة مهمة' : 'Add Task'}
            </Button>
          </div>

          {/* Create Task Form */}
          {showCreateTask && (
            <Card className="p-4">
              <div className="space-y-4">
                <Input
                  placeholder={language === 'ar' ? 'عنوان المهمة' : 'Task Title'}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <Textarea
                  placeholder={language === 'ar' ? 'وصف المهمة' : 'Task Description'}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <select
                  className="w-full p-2 border rounded-md"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
                  <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
                  <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTask}>
                    {language === 'ar' ? 'إنشاء' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {language === 'ar' 
                          ? (task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة')
                          : task.priority
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    
                    {task.assignedAgent && (
                      <div className="text-xs text-blue-600">
                        {language === 'ar' ? 'مُسند إلى' : 'Assigned to'}: {
                          agents.find(a => a.id === task.assignedAgent)?.name
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {!task.assignedAgent && getAvailableAgents().length > 0 && (
                      <select
                        className="text-xs p-1 border rounded"
                        onChange={(e) => e.target.value && assignTask(task.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="">{language === 'ar' ? 'اختر وكيل' : 'Assign Agent'}</option>
                        {getAvailableAgents().map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                    )}
                    
                    {task.status === 'in-progress' && (
                      <Button size="sm" onClick={() => completeTask(task.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="text-center py-8">
            <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لوحة تحكم الوكلاء' : 'Agent Dashboard'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'ستتوفر هنا إحصائيات تفصيلية وتقارير الأداء قريباً'
                : 'Detailed analytics and performance reports coming soon'
              }
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentManagementPanel;
