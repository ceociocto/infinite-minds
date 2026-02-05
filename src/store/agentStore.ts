import { create } from 'zustand';
import type { Agent, Task, Message, LLMConfig } from '@/types';

interface AgentState {
  agents: Agent[];
  tasks: Task[];
  messages: Message[];
  llmConfig: LLMConfig;
  isSimulationRunning: boolean;
  selectedAgent: string | null;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  updateAgentPosition: (agentId: string, position: { x: number; y: number }) => void;
  assignTask: (agentId: string, task: Task) => void;
  completeTask: (taskId: string) => void;
  addMessage: (message: Message) => void;
  setLLMConfig: (config: LLMConfig) => void;
  setSimulationRunning: (running: boolean) => void;
  setSelectedAgent: (agentId: string | null) => void;
  executeTask: (taskDescription: string) => Promise<void>;
}

const initialAgents: Agent[] = [
  {
    id: 'pm-1',
    name: 'PM-Bot',
    role: 'pm',
    roleName: 'Project Manager',
    avatar: '/agent-pm.png',
    position: { x: 20, y: 30 },
    status: 'idle',
    stats: { tasksCompleted: 12, efficiency: 95, collaboration: 88 },
  },
  {
    id: 'dev-1',
    name: 'Dev-Bot',
    role: 'developer',
    roleName: 'Developer',
    avatar: '/agent-dev.png',
    position: { x: 50, y: 25 },
    status: 'idle',
    stats: { tasksCompleted: 28, efficiency: 92, collaboration: 85 },
  },
  {
    id: 'designer-1',
    name: 'Design-Bot',
    role: 'designer',
    roleName: 'Designer',
    avatar: '/agent-designer.png',
    position: { x: 75, y: 40 },
    status: 'idle',
    stats: { tasksCompleted: 18, efficiency: 96, collaboration: 90 },
  },
  {
    id: 'analyst-1',
    name: 'Data-Bot',
    role: 'analyst',
    roleName: 'Data Analyst',
    avatar: '/agent-analyst.png',
    position: { x: 35, y: 60 },
    status: 'idle',
    stats: { tasksCompleted: 15, efficiency: 94, collaboration: 82 },
  },
];

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initialAgents,
  tasks: [],
  messages: [],
  llmConfig: {
    apiUrl: '',
    apiKey: '',
    model: 'gpt-4',
  },
  isSimulationRunning: false,
  selectedAgent: null,

  setAgents: (agents) => set({ agents }),

  updateAgentStatus: (agentId, status) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      ),
    }));
  },

  updateAgentPosition: (agentId, position) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, position } : agent
      ),
    }));
  },

  assignTask: (agentId, task) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, currentTask: task, status: 'working' as const }
          : agent
      ),
      tasks: [...state.tasks, task],
    }));
  },

  completeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: 'completed' as const, completedAt: new Date() }
          : task
      ),
      agents: state.agents.map((agent) =>
        agent.currentTask?.id === taskId
          ? {
              ...agent,
              currentTask: undefined,
              status: 'idle' as const,
              stats: {
                ...agent.stats,
                tasksCompleted: agent.stats.tasksCompleted + 1,
              },
            }
          : agent
      ),
    }));
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages.slice(-49), message],
    }));
  },

  setLLMConfig: (config) => set({ llmConfig: config }),

  setSimulationRunning: (running) => set({ isSimulationRunning: running }),

  setSelectedAgent: (agentId) => set({ selectedAgent: agentId }),

  executeTask: async (taskDescription: string) => {
    const { agents, llmConfig, addMessage, assignTask, updateAgentStatus } = get();
    
    // Log LLM config (for future API integration)
    if (llmConfig.apiUrl) {
      console.log('Using LLM API:', llmConfig.apiUrl);
    }
    
    // Create new task
    const task: Task = {
      id: `task-${Date.now()}`,
      title: taskDescription.slice(0, 50),
      description: taskDescription,
      status: 'pending',
      assignedTo: [],
      dependencies: [],
      createdAt: new Date(),
      progress: 0,
    };

    // PM analyzes and assigns task
    const pm = agents.find((a) => a.role === 'pm');
    if (pm) {
      updateAgentStatus(pm.id, 'thinking');
      addMessage({
        id: `msg-${Date.now()}`,
        from: pm.id,
        to: 'all',
        content: `Analyzing task: "${taskDescription}"`,
        timestamp: new Date(),
        type: 'system',
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Determine which agents to assign based on task content
      const taskLower = taskDescription.toLowerCase();
      const assignedAgents: string[] = [];

      if (taskLower.includes('design') || taskLower.includes('ui') || taskLower.includes('logo') || taskLower.includes('interface')) {
        assignedAgents.push('designer-1');
      }
      if (taskLower.includes('code') || taskLower.includes('develop') || taskLower.includes('program') || taskLower.includes('build')) {
        assignedAgents.push('dev-1');
      }
      if (taskLower.includes('data') || taskLower.includes('analy') || taskLower.includes('report') || taskLower.includes('chart')) {
        assignedAgents.push('analyst-1');
      }
      if (assignedAgents.length === 0) {
        assignedAgents.push('pm-1', 'dev-1');
      }

      updateAgentStatus(pm.id, 'idle');
      addMessage({
        id: `msg-${Date.now() + 1}`,
        from: pm.id,
        to: 'all',
        content: `Task assigned to: ${assignedAgents.map(id => agents.find(a => a.id === id)?.name).join(', ')}`,
        timestamp: new Date(),
        type: 'system',
      });

      // Assign to each agent
      for (const agentId of assignedAgents) {
        const agentTask = { ...task, id: `${task.id}-${agentId}`, assignedTo: [agentId] };
        assignTask(agentId, agentTask);

        // Simulate work progress
        setTimeout(() => {
          updateAgentStatus(agentId, 'working');
          addMessage({
            id: `msg-${Date.now() + 2}`,
            from: agentId,
            to: pm.id,
            content: `Starting work on the task...`,
            timestamp: new Date(),
            type: 'task',
          });
        }, 500);

        // Complete task after random time
        setTimeout(() => {
          get().completeTask(agentTask.id);
          addMessage({
            id: `msg-${Date.now() + 3}`,
            from: agentId,
            to: pm.id,
            content: `Task completed successfully!`,
            timestamp: new Date(),
            type: 'task',
          });
        }, 3000 + Math.random() * 3000);
      }
    }
  },
}));
