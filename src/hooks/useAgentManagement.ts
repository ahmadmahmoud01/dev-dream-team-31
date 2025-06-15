
import { useState, useEffect } from 'react';
import { AIAgent, ProjectTask, AIRole, Language } from '@/types/chat';

export const useAgentManagement = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    // تحميل البيانات المحفوظة من localStorage
    const savedAgents = localStorage.getItem('ai-agents');
    const savedTasks = localStorage.getItem('project-tasks');
    
    if (savedAgents) {
      try {
        setAgents(JSON.parse(savedAgents));
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    }

    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  const saveAgents = (updatedAgents: AIAgent[]) => {
    setAgents(updatedAgents);
    localStorage.setItem('ai-agents', JSON.stringify(updatedAgents));
  };

  const saveTasks = (updatedTasks: ProjectTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('project-tasks', JSON.stringify(updatedTasks));
  };

  const createAgent = (name: string, role: AIRole, description: string) => {
    const newAgent: AIAgent = {
      id: `agent-${Date.now()}`,
      name,
      role,
      description,
      isActive: true,
      completedTasks: [],
      assignedProjects: []
    };
    
    const updatedAgents = [...agents, newAgent];
    saveAgents(updatedAgents);
    return newAgent.id;
  };

  const updateAgent = (agentId: string, updates: Partial<AIAgent>) => {
    const updatedAgents = agents.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    );
    saveAgents(updatedAgents);
  };

  const deleteAgent = (agentId: string) => {
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    const updatedTasks = tasks.map(task => 
      task.assignedAgent === agentId 
        ? { ...task, assignedAgent: undefined, status: 'pending' as const }
        : task
    );
    
    saveAgents(updatedAgents);
    saveTasks(updatedTasks);
  };

  const createTask = (title: string, description: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      status: 'pending',
      priority,
      dependencies: []
    };
    
    const updatedTasks = [...tasks, newTask];
    saveTasks(updatedTasks);
    return newTask.id;
  };

  const assignTask = (taskId: string, agentId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId 
        ? { ...task, assignedAgent: agentId, status: 'in-progress' as const }
        : task
    );
    
    const updatedAgents = agents.map(agent =>
      agent.id === agentId 
        ? { ...agent, currentTask: taskId }
        : agent
    );
    
    saveTasks(updatedTasks);
    saveAgents(updatedAgents);
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.assignedAgent) return;

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    );

    const updatedAgents = agents.map(agent =>
      agent.id === task.assignedAgent 
        ? { 
            ...agent, 
            currentTask: undefined,
            completedTasks: [...agent.completedTasks, taskId]
          }
        : agent
    );

    saveTasks(updatedTasks);
    saveAgents(updatedAgents);
  };

  const getAgentTasks = (agentId: string) => {
    return tasks.filter(task => task.assignedAgent === agentId);
  };

  const getAvailableAgents = () => {
    return agents.filter(agent => agent.isActive && !agent.currentTask);
  };

  return {
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
  };
};
