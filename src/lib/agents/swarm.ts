// Agent Swarm Orchestrator
// Manages multi-agent workflows and coordination

import type { Agent, Task, Message, WorkflowStep, SwarmWorkflow, NewsArticle, NewsSummary, CodeChange } from '@/types';

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
  private workflows: Map<string, SwarmWorkflow> = new Map();
  private messageCallbacks: ((message: Message) => void)[] = [];
  private taskCallbacks: ((task: Task) => void)[] = [];

  constructor() {
    this.initializeAgents();
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

  private emitMessage(message: Message) {
    this.messages.push(message);
    this.messageCallbacks.forEach((cb) => cb(message));
  }

  private emitTaskUpdate(task: Task) {
    this.taskCallbacks.forEach((cb) => cb(task));
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
      status: 'pending',
      assignedTo: [],
      dependencies: [],
      createdAt: new Date(),
      progress: 0,
      scenario,
    };
    this.tasks.set(task.id, task);
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
      this.emitTaskUpdate(task);
    }
  }

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

  // ==================== NEWS ASSISTANT WORKFLOW ====================
  
  async executeNewsWorkflow(query: string): Promise<NewsSummary> {
    const workflowId = `news-${Date.now()}`;
    const workflow: SwarmWorkflow = {
      id: workflowId,
      name: 'News Collection & Translation',
      description: `Collect news about: ${query}`,
      agents: ['pm-1', 'researcher-1', 'writer-1', 'translator-1'],
      steps: [],
      status: 'running',
    };
    this.workflows.set(workflowId, workflow);

    // Step 1: PM analyzes the request
    this.updateAgentStatus('pm-1', 'thinking');
    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: `Analyzing news request: "${query}"`,
      timestamp: new Date(),
      type: 'system',
    });

    await this.delay(1000);

    // Create main task
    const mainTask = this.createTask(
      `News Collection: ${query}`,
      `Collect recent AI product news from China market, summarize, and translate to English`,
      'news'
    );

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: 'Workflow initiated: Research → Summarize → Translate',
      timestamp: new Date(),
      type: 'system',
    });

    this.updateAgentStatus('pm-1', 'idle');

    // Step 2: Researcher collects news
    const researchTask = this.createTask('Research AI News', 'Search and collect recent AI product news from China market', 'news');
    this.assignTask(researchTask.id, 'researcher-1');
    
    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'researcher-1',
      to: 'pm-1',
      content: 'Starting research on China AI market news...',
      timestamp: new Date(),
      type: 'task',
    });

    // Simulate research progress
    for (let i = 0; i <= 100; i += 20) {
      await this.delay(300);
      this.updateTaskProgress(researchTask.id, i);
    }

    // Research results
    const articles: NewsArticle[] = [
      {
        title: '百度文心一言发布新版本，支持多模态理解',
        description: '百度宣布文心一言4.0版本正式上线，新增图像理解和生成能力，支持更复杂的对话场景',
        url: 'https://example.com/news1',
        publishedAt: new Date().toISOString(),
        source: 'TechChina',
      },
      {
        title: '阿里巴巴通义千问开源新模型，性能超越GPT-3.5',
        description: '阿里云发布通义千问72B开源模型，在多项基准测试中表现优异',
        url: 'https://example.com/news2',
        publishedAt: new Date().toISOString(),
        source: 'AI Weekly',
      },
      {
        title: '字节跳动推出AI编程助手，对标GitHub Copilot',
        description: '字节跳动发布豆包编程助手，支持多种编程语言和IDE集成',
        url: 'https://example.com/news3',
        publishedAt: new Date().toISOString(),
        source: 'Developer News',
      },
    ];

    this.completeTask(researchTask.id, articles);
    
    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'researcher-1',
      to: 'writer-1',
      content: `Research complete! Found ${articles.length} relevant articles about China AI products.`,
      timestamp: new Date(),
      type: 'task',
    });

    // Step 3: Writer summarizes
    const writeTask = this.createTask('Summarize News', 'Create a comprehensive summary of the collected news', 'news');
    this.assignTask(writeTask.id, 'writer-1');

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'writer-1',
      to: 'researcher-1',
      content: 'Received research data. Starting summarization...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1500);
    this.updateTaskProgress(writeTask.id, 50);

    const summary = `近期中国AI产品市场呈现蓬勃发展态势。百度发布文心一言4.0版本，大幅提升多模态能力；阿里巴巴开源通义千问72B模型，性能表现优异；字节跳动推出AI编程助手，进军开发者工具市场。这些进展标志着中国AI产业正在加速追赶国际领先水平。`;

    await this.delay(1000);
    this.completeTask(writeTask.id, summary);

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'writer-1',
      to: 'translator-1',
      content: 'Summary completed. Handing over for translation.',
      timestamp: new Date(),
      type: 'task',
    });

    // Step 4: Translator translates
    const translateTask = this.createTask('Translate to English', 'Translate the summary into English', 'news');
    this.assignTask(translateTask.id, 'translator-1');

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'translator-1',
      to: 'writer-1',
      content: 'Starting English translation...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1500);
    this.updateTaskProgress(translateTask.id, 100);

    const translatedSummary = `China's AI product market is showing robust growth momentum. Baidu released Wenxin Yiyan 4.0 with significantly enhanced multimodal capabilities; Alibaba open-sourced the Tongyi Qianwen 72B model with excellent performance; ByteDance launched an AI coding assistant, entering the developer tools market. These developments mark China's AI industry accelerating to catch up with international leading standards.`;

    this.completeTask(translateTask.id, translatedSummary);

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'translator-1',
      to: 'pm-1',
      content: 'Translation completed! Workflow finished successfully.',
      timestamp: new Date(),
      type: 'result',
    });

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: 'News workflow completed successfully!',
      timestamp: new Date(),
      type: 'system',
    });

    workflow.status = 'completed';
    this.completeTask(mainTask.id, { original: summary, translated: translatedSummary, articles });

    return {
      original: summary,
      translated: translatedSummary,
      articles,
    };
  }

  // ==================== GITHUB WORKFLOW ====================

  async executeGitHubWorkflow(repoUrl: string, requirements: string): Promise<{ success: boolean; changes: CodeChange[]; deploymentUrl?: string }> {
    const workflowId = `github-${Date.now()}`;
    const workflow: SwarmWorkflow = {
      id: workflowId,
      name: 'GitHub Project Modification',
      description: `Modify ${repoUrl} based on requirements`,
      agents: ['pm-1', 'analyst-1', 'dev-1'],
      steps: [],
      status: 'running',
    };
    this.workflows.set(workflowId, workflow);

    // Parse repo URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    const repo = repoMatch ? { owner: repoMatch[1], repo: repoMatch[2].replace('.git', '') } : { owner: 'ceociocto', repo: 'investment-advisor' };

    // Step 1: PM analyzes requirements
    this.updateAgentStatus('pm-1', 'thinking');
    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: `Analyzing GitHub project modification request for ${repo.owner}/${repo.repo}`,
      timestamp: new Date(),
      type: 'system',
    });

    await this.delay(1000);

    const mainTask = this.createTask(
      `GitHub Project: ${repo.repo}`,
      `Analyze, modify and deploy ${repoUrl} - ${requirements}`,
      'github'
    );

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: 'Workflow: Analyze → Modify → Test → Deploy',
      timestamp: new Date(),
      type: 'system',
    });

    this.updateAgentStatus('pm-1', 'idle');

    // Step 2: Analyst analyzes codebase
    const analyzeTask = this.createTask('Analyze Codebase', `Analyze repository structure and identify modification points`, 'github');
    this.assignTask(analyzeTask.id, 'analyst-1');

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'analyst-1',
      to: 'pm-1',
      content: `Cloning repository ${repo.owner}/${repo.repo}...`,
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(2000);
    this.updateTaskProgress(analyzeTask.id, 50);

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'analyst-1',
      to: 'pm-1',
      content: 'Analyzing project structure and dependencies...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(1500);

    const analysis = {
      techStack: 'Python, Flask, HTML/CSS',
      structure: ['app.py', 'templates/', 'static/', 'requirements.txt'],
      modificationPoints: ['Update UI styling', 'Add new API endpoint', 'Improve error handling'],
    };

    this.completeTask(analyzeTask.id, analysis);

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'analyst-1',
      to: 'dev-1',
      content: `Analysis complete. Tech stack: ${analysis.techStack}. Ready for modifications.`,
      timestamp: new Date(),
      type: 'task',
    });

    // Step 3: Developer makes changes
    const devTask = this.createTask('Implement Changes', 'Modify code based on analysis and requirements', 'github');
    this.assignTask(devTask.id, 'dev-1');

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'dev-1',
      to: 'analyst-1',
      content: 'Starting code modifications...',
      timestamp: new Date(),
      type: 'task',
    });

    const changes: CodeChange[] = [
      {
        path: 'app.py',
        content: '# Modified app.py with new features\nfrom flask import Flask, render_template, jsonify\n\napp = Flask(__name__)\n\n@app.route(\"/\")\ndef home():\n    return render_template(\'index.html\')\n\n@app.route(\"/api/health\")\ndef health():\n    return jsonify({\"status\": \"ok\", \"version\": \"2.0\"})\n\nif __name__ == \"__main__":\n    app.run(debug=True)',
        action: 'update',
      },
      {
        path: 'static/css/style.css',
        content: '/* Enhanced styles */\nbody { font-family: Arial, sans-serif; background: #f5f5f5; }\n.container { max-width: 1200px; margin: 0 auto; padding: 20px; }',
        action: 'create',
      },
    ];

    for (let i = 0; i <= 100; i += 25) {
      await this.delay(400);
      this.updateTaskProgress(devTask.id, i);
      if (i === 50) {
        this.emitMessage({
          id: `msg-${Date.now()}`,
          from: 'dev-1',
          to: 'pm-1',
          content: `Progress: Modified ${changes.length} files. Testing changes...`,
          timestamp: new Date(),
          type: 'task',
        });
      }
    }

    this.completeTask(devTask.id, changes);

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'dev-1',
      to: 'pm-1',
      content: 'Code modifications complete. Ready for deployment.',
      timestamp: new Date(),
      type: 'task',
    });

    // Step 4: PM coordinates deployment
    const deployTask = this.createTask('Deploy Project', 'Deploy modified project to Cloudflare', 'github');
    this.assignTask(deployTask.id, 'pm-1');

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'dev-1',
      content: 'Initiating deployment to Cloudflare Pages...',
      timestamp: new Date(),
      type: 'task',
    });

    await this.delay(2000);
    this.updateTaskProgress(deployTask.id, 100);

    const deploymentUrl = `https://${repo.repo}-modified.pages.dev`;

    this.completeTask(deployTask.id, { url: deploymentUrl });

    this.emitMessage({
      id: `msg-${Date.now()}`,
      from: 'pm-1',
      to: 'all',
      content: `Deployment successful! Project live at: ${deploymentUrl}`,
      timestamp: new Date(),
      type: 'result',
    });

    workflow.status = 'completed';
    this.completeTask(mainTask.id, { changes, deploymentUrl });

    return {
      success: true,
      changes,
      deploymentUrl,
    };
  }

  // Utility
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Reset swarm
  reset() {
    this.tasks.clear();
    this.messages = [];
    this.workflows.clear();
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
