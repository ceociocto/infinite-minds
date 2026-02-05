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
  agentProgress: Record<string, number>;
  hasRealAI: boolean;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  updateAgentPosition: (agentId: string, position: { x: number; y: number }) => void;
  updateAgentProgress: (agentId: string, progress: number) => void;
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
  testAPIConnection: () => Promise<{ success: boolean; message: string }>;
}

const initialLLMConfig: LLMConfig = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '',
  model: 'glm-4-flash',
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

  // Subscribe to agent progress updates
  swarm.onAgentProgress((agentId, progress) => {
    set((state) => ({
      agentProgress: {
        ...state.agentProgress,
        [agentId]: progress,
      },
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
    agentProgress: {},
    hasRealAI: false,

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

    updateAgentProgress: (agentId, progress) => {
      set((state) => ({
        agentProgress: {
          ...state.agentProgress,
          [agentId]: progress,
        },
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

    setLLMConfig: (config) => {
      set({ llmConfig: config });
      // 更新swarm的API配置
      swarm.setApiConfig(config.apiKey, config.model);
      // 更新hasRealAI状态
      set({ hasRealAI: swarm.hasRealAI() });
    },

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
        const lowerTask = taskDescription.toLowerCase();
        
        if (lowerTask.includes('news') || lowerTask.includes('翻译') || lowerTask.includes('新闻')) {
          await get().executeNewsScenario();
        } else if (lowerTask.includes('github') || lowerTask.includes('deploy') || lowerTask.includes('code')) {
          const repoMatch = taskDescription.match(/https:\/\/github\.com\/[^\s]+/);
          await get().executeGitHubScenario(repoMatch?.[0]);
        } else {
          // 通用任务执行
          const result = await swarm.executeGeneralTask(taskDescription);
          
          if (result.success) {
            addMessage({
              id: `msg-${Date.now()}`,
              from: 'pm-1',
              to: 'user',
              content: result.result,
              timestamp: new Date(),
              type: 'result',
            });
          }
        }
      } catch (error) {
        console.error('Task execution failed:', error);
        addMessage({
          id: `msg-${Date.now()}`,
          from: 'system',
          to: 'user',
          content: `任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date(),
          type: 'system',
        });
      } finally {
        setIsExecuting(false);
        // 刷新agents状态
        set({ agents: swarm.getAgents(), tasks: swarm.getTasks() });
      }
    },

    executeNewsScenario: async () => {
      const { setIsExecuting, setCurrentResult, addMessage } = get();
      setIsExecuting(true);

      try {
        const result = await swarm.executeNewsWorkflow('China AI products market');
        setCurrentResult(result);
        
        addMessage({
          id: `msg-${Date.now()}`,
          from: 'pm-1',
          to: 'user',
          content: `新闻收集完成！共找到 ${result.articles.length} 篇文章`,
          timestamp: new Date(),
          type: 'result',
        });
      } catch (error) {
        console.error('News scenario failed:', error);
        addMessage({
          id: `msg-${Date.now()}`,
          from: 'system',
          to: 'user',
          content: `新闻工作流失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date(),
          type: 'system',
        });
      } finally {
        setIsExecuting(false);
        set({ agents: swarm.getAgents(), tasks: swarm.getTasks() });
      }
    },

    executeGitHubScenario: async (repoUrl?: string) => {
      const { setIsExecuting, addMessage } = get();
      setIsExecuting(true);

      try {
        const url = repoUrl || 'https://github.com/ceociocto/investment-advisor.git';
        const result = await swarm.executeGitHubWorkflow(url, 'Update UI and add health check endpoint');
        
        if (result.success) {
          addMessage({
            id: `msg-${Date.now()}`,
            from: 'pm-1',
            to: 'user',
            content: `GitHub项目修改完成！部署地址: ${result.deploymentUrl}`,
            timestamp: new Date(),
            type: 'result',
          });
        }
      } catch (error) {
        console.error('GitHub scenario failed:', error);
        addMessage({
          id: `msg-${Date.now()}`,
          from: 'system',
          to: 'user',
          content: `GitHub工作流失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date(),
          type: 'system',
        });
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
        agentProgress: {},
      });
    },

    testAPIConnection: async () => {
      const { llmConfig } = get();
      
      if (!llmConfig.apiKey) {
        return { success: false, message: '请先配置API Key' };
      }

      try {
        const { ZhipuAIService } = await import('@/lib/services/zhipu');
        const service = new ZhipuAIService(llmConfig.apiKey, llmConfig.model);
        const result = await service.testConnection();
        
        if (result.success) {
          set({ hasRealAI: true });
        }
        
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : '连接测试失败',
        };
      }
    },
  };
});
