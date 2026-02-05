export interface Agent {
  id: string;
  name: string;
  role: 'pm' | 'developer' | 'designer' | 'analyst';
  roleName: string;
  avatar: string;
  position: { x: number; y: number };
  status: 'idle' | 'working' | 'thinking' | 'completed' | 'error';
  currentTask?: Task;
  stats: {
    tasksCompleted: number;
    efficiency: number;
    collaboration: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string[];
  dependencies: string[];
  createdAt: Date;
  completedAt?: Date;
  progress: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'task' | 'chat' | 'system';
}

export interface LLMConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export type AgentRole = 'pm' | 'developer' | 'designer' | 'analyst';

export const AGENT_ROLES: Record<AgentRole, { name: string; color: string; description: string }> = {
  pm: { 
    name: 'Project Manager', 
    color: '#3b82f6', 
    description: 'Coordinates tasks and manages workflow'
  },
  developer: { 
    name: 'Developer', 
    color: '#1e293b', 
    description: 'Writes code and builds applications'
  },
  designer: { 
    name: 'Designer', 
    color: '#ec4899', 
    description: 'Creates visual designs and user interfaces'
  },
  analyst: { 
    name: 'Data Analyst', 
    color: '#10b981', 
    description: 'Analyzes data and generates insights'
  },
};
