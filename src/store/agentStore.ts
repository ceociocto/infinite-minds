'use client';

import { create } from 'zustand';
import type { Agent, Task, Message, LLMConfig, NewsSummary } from '@/types';
import { getAgentSwarm } from '@/lib/agents/swarm';

interface AgentState {
  agents: Agent[];
  tasks: Task[];
  messages: Message[];
  llmConfig: LLMConfig;
  isSimulationRunning: boolean;
  selectedAgent: string | null;
  currentResult: NewsSummary | null;
  isExecuting: boolean;
  
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
  setCurrentResult: (result: NewsSummary | null) => void;
  setIsExecuting: (executing: boolean) => void;
  executeTask: (taskDescription: string) => Promise<void>;
  executeNewsScenario: () => Promise<void>;
  executeGitHubScenario: (repoUrl?: string) => Promise<void>;
  resetSwarm: () => void;
}

const initialLLMConfig: LLMConfig = {
  apiUrl: '',
  apiKey: '',
  model: 'gpt-4',
};

export const useAgentStore = create<AgentState>((set, get) => {
  const swarm = getAgentSwarm();

  // Subscribe to swarm events
  swarm.onMessage((message) => {
    set((state) => ({
      messages: [...state.messages.slice(-99), message],
    }));
  });

  swarm.onTaskUpdate((task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  });

  return {
    agents: swarm.getAgents(),
    tasks: swarm.getTasks(),
    messages: swarm.getMessages(),
    llmConfig: initialLLMConfig,
    isSimulationRunning: false,
    selectedAgent: null,
    currentResult: null,
    isExecuting: false,

    setAgents: (agents) => set({ agents }),

    updateAgentStatus: (agentId, status) => {
      swarm.updateAgentStatus(agentId, status);
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
        messages: [...state.messages.slice(-99), message],
      }));
    },

    setLLMConfig: (config) => set({ llmConfig: config }),

    setSimulationRunning: (running) => set({ isSimulationRunning: running }),

    setSelectedAgent: (agentId) => set({ selectedAgent: agentId }),

    setCurrentResult: (result) => set({ currentResult: result }),

    setIsExecuting: (executing) => set({ isExecuting: executing }),

    executeTask: async (taskDescription: string) => {
      const { addMessage, setIsExecuting } = get();
      
      setIsExecuting(true);
      
      addMessage({
        id: `msg-${Date.now()}`,
        from: 'user',
        to: 'pm-1',
        content: taskDescription,
        timestamp: new Date(),
        type: 'chat',
      });

      try {
        // Determine which scenario to run based on task description
        const lowerTask = taskDescription.toLowerCase();
        
        if (lowerTask.includes('news') || lowerTask.includes('翻译') || lowerTask.includes('新闻')) {
          await get().executeNewsScenario();
        } else if (lowerTask.includes('github') || lowerTask.includes('deploy') || lowerTask.includes('code')) {
          const repoMatch = taskDescription.match(/https:\/\/github\.com\/[^\s]+/);
          await get().executeGitHubScenario(repoMatch?.[0]);
        } else {
          // General task execution with basic agent coordination
          await swarm.executeNewsWorkflow(taskDescription);
        }
      } finally {
        setIsExecuting(false);
      }
    },

    executeNewsScenario: async () => {
      const { setIsExecuting, setCurrentResult } = get();
      setIsExecuting(true);

      try {
        const result = await swarm.executeNewsWorkflow('China AI products market');
        setCurrentResult(result);
      } finally {
        setIsExecuting(false);
        // Refresh agents state
        set({ agents: swarm.getAgents(), tasks: swarm.getTasks() });
      }
    },

    executeGitHubScenario: async (repoUrl?: string) => {
      const { setIsExecuting } = get();
      setIsExecuting(true);

      try {
        const url = repoUrl || 'https://github.com/ceociocto/investment-advisor.git';
        await swarm.executeGitHubWorkflow(url, 'Update UI and add health check endpoint');
      } finally {
        setIsExecuting(false);
        set({ agents: swarm.getAgents(), tasks: swarm.getTasks() });
      }
    },

    resetSwarm: () => {
      swarm.reset();
      set({
        agents: swarm.getAgents(),
        tasks: [],
        messages: [],
        currentResult: null,
        isExecuting: false,
      });
    },
  };
});
