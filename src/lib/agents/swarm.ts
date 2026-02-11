// Enhanced Agent Swarm with Real AI Integration
// 集成智谱AI的真实Agent能力 - 客户端版本（调用服务端API）

import type { Agent, Task, Message, NewsSummary, CodeChange, GitHubTokenConfig } from '@/types';
import { MultiAgentOrchestrator, type WorkflowProgress } from '@/lib/services/orchestrator';

let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

interface AgentConfig {
  id: string;
  name: string;
  role: Agent['role'];
  roleName: string;
  avatar: string;
  position: { x: number; y: number };
}

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'pm-1',
    name: 'PM-Bot',
    role: 'pm',
    roleName: 'Project Manager',
    avatar: '/agent-pm.png',
    position: { x: 20, y: 30 },
  },
  {
    id: 'researcher-1',
    name: 'Research-Bot',
    role: 'researcher',
    roleName: 'Researcher',
    avatar: '/agent-researcher.png',
    position: { x: 50, y: 20 },
  },
  {
    id: 'writer-1',
    name: 'Writer-Bot',
    role: 'writer',
    roleName: 'Content Writer',
    avatar: '/agent-writer.png',
    position: { x: 75, y: 35 },
  },
  {
    id: 'translator-1',
    name: 'Translate-Bot',
    role: 'translator',
    roleName: 'Translator',
    avatar: '/agent-translator.png',
    position: { x: 35, y: 60 },
  },
  {
    id: 'dev-1',
    name: 'Dev-Bot',
    role: 'developer',
    roleName: 'Developer',
    avatar: '/agent-dev.png',
    position: { x: 60, y: 55 },
  },
  {
    id: 'analyst-1',
    name: 'Data-Bot',
    role: 'analyst',
    roleName: 'Data Analyst',
    avatar: '/agent-analyst.png',
    position: { x: 85, y: 70 },
  },
];

export class AgentSwarm {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private messages: Message[] = [];
  private messageCallbacks: ((message: Message) => void)[] = [];
  private taskCallbacks: ((task: Task) => void)[] = [];
  private progressCallbacks: ((agentId: string, progress: number) => void)[] = [];
  private orchestrator: MultiAgentOrchestrator;

  constructor() {
    this.initializeAgents();
    this.orchestrator = new MultiAgentOrchestrator();
  }

  // 设置GitHub配置
  setGitHubConfig(config: GitHubTokenConfig): void {
    this.orchestrator.setGitHubConfig(config);
  }

  // 检查是否配置了真实AI（现在总是返回true，因为由服务端处理）
  hasRealAI(): boolean {
    return true;
  }

  // 检查是否配置了GitHub
  hasGitHubConfig(): boolean {
    return this.orchestrator.isGitHubReady();
  }

  private initializeAgents() {
    DEFAULT_AGENTS.forEach((config) => {
      const agent: Agent = {
        ...config,
        status: 'idle',
        stats: {
          tasksCompleted: 0,
          efficiency: 90 + Math.floor(Math.random() * 10),
          collaboration: 85 + Math.floor(Math.random() * 15),
        },
      };
      this.agents.set(config.id, agent);
    });
  }

  // Event handling
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback);
  }

  onTaskUpdate(callback: (task: Task) => void) {
    this.taskCallbacks.push(callback);
  }

  onAgentProgress(callback: (agentId: string, progress: number) => void) {
    this.progressCallbacks.push(callback);
  }

  private emitMessage(message: Message) {
    this.messages.push(message);
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  private emitTaskUpdate(task: Task) {
    this.taskCallbacks.forEach((cb) => cb(task));
  }

  private emitAgentProgress(agentId: string, progress: number) {
    this.progressCallbacks.forEach((cb) => cb(agentId, progress));
  }

  // Agent management
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  updateAgentStatus(agentId: string, status: Agent['status']) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
    }
  }

  // Task management
  createTask(title: string, description: string, scenario?: Task['scenario']): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      status: 'in_progress',
      assignedTo: [],
      dependencies: [],
      createdAt: new Date(),
      progress: 0,
      scenario,
    };
    this.tasks.set(task.id, task);
    // 通知订阅者任务已创建
    this.emitTaskUpdate(task);
    return task;
  }

  assignTask(taskId: string, agentId: string) {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);
    if (task && agent) {
      task.assignedTo.push(agentId);
      agent.currentTask = task;
      agent.status = 'working';
      this.emitTaskUpdate(task);
    }
  }

  updateTaskProgress(taskId: string, progress: number) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.progress = progress;
      console.log(`[Task Progress] ${task.title}: ${progress}%`);
      this.emitTaskUpdate(task);
    } else {
      console.log(`[Task Progress] Task not found: ${taskId}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  completeTask(taskId: string, result?: any) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      task.result = result;

      // Update agent stats
      task.assignedTo.forEach((agentId) => {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = 'idle';
          agent.currentTask = undefined;
          agent.stats.tasksCompleted++;
        }
      });

      this.emitTaskUpdate(task);
    }
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getMessages(): Message[] {
    return this.messages;
  }

  // ==================== NEWS WORKFLOW ====================

  async executeNewsWorkflow(query: string): Promise<NewsSummary> {
    const mainTask = this.createTask(
      `News Collection: ${query}`,
      `Collect recent news about: ${query}, summarize and translate`,
      'news'
    );

    // PM启动工作流
    this.updateAgentStatus('pm-1', 'thinking');
    this.emitMessage({
      id: generateMessageId(),
      from: 'pm-1',
      to: 'all',
      content: `启动新闻收集工作流: "${query}"`,
      timestamp: new Date(),
      type: 'system',
    });

    await this.delay(500);
    this.updateAgentStatus('pm-1', 'idle');

    // 监听进度更新
    this.orchestrator.onProgress((progress: WorkflowProgress) => {
      console.log('[Workflow Progress]', progress);
      
      // 更新Agent状态
      this.updateAgentStatus(progress.agentId, progress.status === 'running' ? 'working' : 'idle');
      
      // 发送消息
      this.emitMessage({
        id: generateMessageId(),
        from: progress.agentId,
        to: 'all',
        content: progress.message || `${progress.agentId} ${progress.status}`,
        timestamp: new Date(),
        type: progress.status === 'failed' ? 'system' : 'task',
      });

      // 更新Agent进度
      this.emitAgentProgress(progress.agentId, progress.progress);
      
      // 更新主任务进度
      if (progress.stepId === 'workflow') {
        this.updateTaskProgress(mainTask.id, progress.progress);
      }
    });

    try {
      const result = await this.orchestrator.executeNewsWorkflow(query);
      
      this.completeTask(mainTask.id, result);
      
      this.emitMessage({
        id: generateMessageId(),
        from: 'pm-1',
        to: 'all',
        content: '新闻工作流完成！',
        timestamp: new Date(),
        type: 'result',
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '工作流执行失败';
      
      this.emitMessage({
        id: generateMessageId(),
        from: 'pm-1',
        to: 'all',
        content: `工作流失败: ${errorMsg}`,
        timestamp: new Date(),
        type: 'system',
      });

      // 返回模拟数据作为后备
      return this.executeSimulatedNewsWorkflow(query, mainTask.id);
    }
  }

  private async executeSimulatedNewsWorkflow(query: string, mainTaskId: string): Promise<NewsSummary> {
    // Step 1: Researcher
    const researchTask = this.createTask('Research News', `Search news about: ${query}`, 'news');
    this.assignTask(researchTask.id, 'researcher-1');
    
    this.emitMessage({
      id: generateMessageId(),
      from: 'researcher-1',
      to: 'pm-1',
      content: 'Starting research (simulated mode)...',
      timestamp: new Date(),
      type: 'task',
    });

    for (let i = 0; i <= 100; i += 20) {
      await this.delay(300);
      this.updateTaskProgress(researchTask.id, i);
      this.emitAgentProgress('researcher-1', i);
    }

    const articles = [
      {
        title: 'AI技术突破：新一代大语言模型发布',
        description: '某科技公司发布了最新的大语言模型，性能显著提升',
        url: 'https://example.com/ai-news',
        publishedAt: new Date().toISOString(),
        source: 'Tech News',
      },
      {
        title: '人工智能在医疗领域的应用进展',
        description: 'AI辅助诊断系统在多家医院投入使用',
        url: 'https://example.com/medical-ai',
        publishedAt: new Date().toISOString(),
        source: 'Medical Today',
      },
    ];

    this.completeTask(researchTask.id, articles);

    // Step 2: Writer
    const writeTask = this.createTask('Summarize News', 'Create summary', 'news');
    this.assignTask(writeTask.id, 'writer-1');

    this.emitMessage({
      id: generateMessageId(),
      from: 'writer-1',
      to: 'researcher-1',
      content: 'Writing summary (simulated mode)...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1000);
    this.updateTaskProgress(writeTask.id, 50);
    this.emitAgentProgress('writer-1', 50);

    const summary = `近期AI领域取得重大进展。新一代大语言模型发布，性能显著提升；人工智能在医疗领域的应用也取得突破，AI辅助诊断系统在多家医院投入使用。这些进展标志着AI技术正在加速落地应用。`;

    await this.delay(1000);
    this.completeTask(writeTask.id, summary);
    this.emitAgentProgress('writer-1', 100);

    // Step 3: Translator
    const translateTask = this.createTask('Translate', 'Translate to English', 'news');
    this.assignTask(translateTask.id, 'translator-1');

    this.emitMessage({
      id: generateMessageId(),
      from: 'translator-1',
      to: 'writer-1',
      content: 'Translating (simulated mode)...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1000);
    this.updateTaskProgress(translateTask.id, 100);
    this.emitAgentProgress('translator-1', 100);

    const translated = `Recent major progress has been made in the AI field. New generation large language models have been released with significantly improved performance; AI applications in healthcare have also achieved breakthroughs, with AI-assisted diagnostic systems being deployed in multiple hospitals. These developments mark the accelerating practical application of AI technology.`;

    this.completeTask(translateTask.id, translated);

    const result: NewsSummary = {
      original: summary,
      translated,
      articles,
    };

    this.completeTask(mainTaskId, result);

    this.emitMessage({
      id: generateMessageId(),
      from: 'pm-1',
      to: 'all',
      content: 'News workflow completed (simulated mode)',
      timestamp: new Date(),
      type: 'result',
    });

    return result;
  }

  // ==================== GITHUB WORKFLOW ====================

  async executeGitHubWorkflow(repoUrl: string, requirements: string): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string }> {
    const mainTask = this.createTask(
      `GitHub: ${repoUrl}`,
      `Modify ${repoUrl} - ${requirements}`,
      'github'
    );

    this.updateAgentStatus('pm-1', 'thinking');
    this.emitMessage({
      id: generateMessageId(),
      from: 'pm-1',
      to: 'all',
      content: `启动GitHub项目修改工作流`,
      timestamp: new Date(),
      type: 'system',
    });

    await this.delay(500);
    this.updateAgentStatus('pm-1', 'idle');

    // 监听进度更新
    this.orchestrator.onProgress((progress: WorkflowProgress) => {
      this.updateAgentStatus(progress.agentId, progress.status === 'running' ? 'working' : 'idle');
      
      this.emitMessage({
        id: generateMessageId(),
        from: progress.agentId,
        to: 'all',
        content: progress.message || `${progress.agentId} ${progress.status}`,
        timestamp: new Date(),
        type: progress.status === 'failed' ? 'system' : 'task',
      });

      this.emitAgentProgress(progress.agentId, progress.progress);
      
      // 更新主任务进度
      if (progress.stepId === 'workflow') {
        this.updateTaskProgress(mainTask.id, progress.progress);
      }
    });

    try {
      const result = await this.orchestrator.executeGitHubWorkflow(repoUrl, requirements);
      
      this.completeTask(mainTask.id, result);
      
      const successMessage = result.pullRequestUrl 
        ? `Pull Request 创建成功: ${result.pullRequestUrl}`
        : '代码修改完成（未配置GitHub Token，仅生成代码建议）';
      
      this.emitMessage({
        id: generateMessageId(),
        from: 'pm-1',
        to: 'all',
        content: successMessage,
        timestamp: new Date(),
        type: 'result',
      });

      return {
        success: result.success,
        changes: result.changes,
        pullRequestUrl: result.pullRequestUrl,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '工作流执行失败';
      
      this.emitMessage({
        id: generateMessageId(),
        from: 'pm-1',
        to: 'all',
        content: `GitHub工作流失败: ${errorMsg}`,
        timestamp: new Date(),
        type: 'system',
      });

      return this.executeSimulatedGitHubWorkflow(repoUrl, requirements, mainTask.id);
    }
  }

  private async executeSimulatedGitHubWorkflow(
    repoUrl: string,
    requirements: string,
    mainTaskId: string
  ): Promise<{ success: boolean; changes: CodeChange[]; pullRequestUrl?: string }> {
    // Analyst
    const analyzeTask = this.createTask('Analyze', 'Analyze codebase', 'github');
    this.assignTask(analyzeTask.id, 'analyst-1');

    this.emitMessage({
      id: generateMessageId(),
      from: 'analyst-1',
      to: 'pm-1',
      content: 'Analyzing repository (simulated mode)...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1500);
    this.completeTask(analyzeTask.id, { techStack: 'React, TypeScript' });

    // Developer
    const devTask = this.createTask('Develop', 'Implement changes', 'github');
    this.assignTask(devTask.id, 'dev-1');

    this.emitMessage({
      id: generateMessageId(),
      from: 'dev-1',
      to: 'analyst-1',
      content: 'Implementing changes (simulated mode)...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(2000);

    const changes: CodeChange[] = [
      {
        path: 'src/App.tsx',
        content: '// Updated App component\nexport function App() {\n  return <div>Hello World</div>;\n}',
        action: 'update',
      },
    ];

    this.completeTask(devTask.id, changes);

    this.completeTask(mainTaskId, { changes });

    this.emitMessage({
      id: generateMessageId(),
      from: 'pm-1',
      to: 'all',
      content: '代码修改完成 (模拟模式)',
      timestamp: new Date(),
      type: 'result',
    });

    return { success: true, changes };
  }

  // ==================== GENERAL TASK ====================

  async executeGeneralTask(taskDescription: string): Promise<{ success: boolean; result: string }> {
    const mainTask = this.createTask('General Task', taskDescription, 'general');

    this.emitMessage({
      id: generateMessageId(),
      from: 'pm-1',
      to: 'all',
      content: `执行任务: ${taskDescription}`,
      timestamp: new Date(),
      type: 'system',
    });

    try {
      const result = await this.orchestrator.executeGeneralWorkflow(taskDescription);
      this.completeTask(mainTask.id, result);
      return { success: result.success, result: result.result };
    } catch {
      return { success: false, result: '任务执行失败' };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  reset() {
    this.tasks.clear();
    this.messages = [];
    this.initializeAgents();
  }
}

// Singleton instance
let swarmInstance: AgentSwarm | null = null;

export function getAgentSwarm(): AgentSwarm {
  if (!swarmInstance) {
    swarmInstance = new AgentSwarm();
  }
  return swarmInstance;
}

export function resetAgentSwarm() {
  swarmInstance = null;
}