// Agent Swarm Types

export type AgentRole = 'pm' | 'developer' | 'designer' | 'analyst' | 'researcher' | 'writer' | 'translator';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
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
  result?: any;
  scenario?: 'news' | 'github' | 'general';
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'task' | 'chat' | 'system' | 'result';
  result?: any;
}

export interface LLMConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface GitHubTokenConfig {
  token: string;
}

export interface SwarmWorkflow {
  id: string;
  name: string;
  description: string;
  agents: string[];
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  dependencies: string[];
}

// News Assistant Types
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface NewsSummary {
  original: string;
  translated: string;
  articles: NewsArticle[];
}

// GitHub Types
export interface GitHubRepo {
  owner: string;
  repo: string;
  url: string;
}

export interface CodeChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export const AGENT_ROLES: Record<AgentRole, { name: string; color: string; description: string; icon: string }> = {
  pm: { 
    name: 'Project Manager', 
    color: '#3b82f6', 
    description: 'Coordinates tasks and manages workflow',
    icon: 'Cpu'
  },
  developer: { 
    name: 'Developer', 
    color: '#1e293b', 
    description: 'Writes code and builds applications',
    icon: 'Code'
  },
  designer: { 
    name: 'Designer', 
    color: '#ec4899', 
    description: 'Creates visual designs and user interfaces',
    icon: 'Palette'
  },
  analyst: { 
    name: 'Data Analyst', 
    color: '#10b981', 
    description: 'Analyzes data and generates insights',
    icon: 'BarChart3'
  },
  researcher: {
    name: 'Researcher',
    color: '#8b5cf6',
    description: 'Gathers information and conducts research',
    icon: 'Search'
  },
  writer: {
    name: 'Content Writer',
    color: '#f59e0b',
    description: 'Creates and edits written content',
    icon: 'FileText'
  },
  translator: {
    name: 'Translator',
    color: '#06b6d4',
    description: 'Translates content between languages',
    icon: 'Languages'
  },
};

export interface GitHubWorkflowRun {
  id: number;
  name: string | null;
  status: 'queued' | 'in_progress' | 'completed' | 'failure';
  conclusion: 'success' | 'failure' | 'timed_out' | null;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentResult {
  success: boolean;
  workflowRunId?: number;
  workflowUrl?: string;
  status: string;
  merged: boolean;
  mergedAt?: string;
  duration?: number;
  pullRequestUrl?: string;
}

export interface GitHubChangeProgress {
  stepId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  detail?: string;
}
