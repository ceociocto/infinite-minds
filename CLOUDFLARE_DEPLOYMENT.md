# Cloudflare 部署指南

## 🎯 架构概述

```
用户浏览器
    ↓
Cloudflare Workers (infinite-minds)
    ↓
Zhipu AI API
    ↓
GitHub API
    ↓
目标仓库 + GitHub Actions 自动部署
```

## 📋 部署前准备

### 1. 获取 API Keys

#### 智谱 AI API Key
1. 访问 [Zhipu AI 开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 创建 API Key
4. 保存 Key: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### GitHub Token
1. 访问 [GitHub Token 设置](https://github.com/settings/tokens)
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 配置权限：
   - `repo` (完整仓库访问权限)
   - `workflow` (GitHub Actions 权限)
4. 生成并保存 Token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. 目标仓库配置

为要修改的 GitHub 仓库添加自动部署（以 Vercel 为例）：

#### 方案 A: Vercel 自动部署
```yaml
# .github/workflows/auto-merge.yml
name: Auto Merge and Deploy

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  merge-and-deploy:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy
        run: |
          echo "PR merged, Vercel will auto-deploy"
```

Vercel 会自动监听 main 分支的变更并部署。

#### 方案 B: Cloudflare Pages 自动部署
```yaml
# .github/workflows/cloudflare-pages.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: YOUR_ACCOUNT_ID
          projectName: YOUR_PROJECT_NAME
```

## 🚀 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 Cloudflare Workers 项目中配置环境变量：

#### 方式 A: 通过 Cloudflare Dashboard
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 选择你的项目 → Settings → Environment Variables
4. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ZHIPU_API_KEY` | `your-zhipu-api-key` | 智谱 AI API Key |
| `GITHUB_TOKEN` | `ghp_your-github-token` | GitHub Personal Access Token |

#### 方式 B: 通过 `.dev.vars` (本地开发)

创建 `.dev.vars` 文件：

```env
ZHIPU_API_KEY=your-zhipu-api-key
GITHUB_TOKEN=ghp_your-github-token
```

⚠️ **注意**: `.dev.vars` 文件不会被提交到 Git

#### 方式 C: 通过 Wrangler CLI

创建 `wrangler.toml`:

```toml
name = "infinite-minds"
compatibility_date = "2024-01-01"

[env.production.vars]
ZHIPU_API_KEY = "your-production-key"
GITHUB_TOKEN = "ghp_production-token"

# 本地开发会自动读取 .dev.vars
```

### 3. 本地测试

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 本地开发
npm run dev

# 访问 http://localhost:3000
```

### 4. 构建并部署

```bash
# 构建 OpenNext.js (适配 Cloudflare)
npm run build

# 部署到 Cloudflare
npm run deploy
```

或使用 Wrangler 直接部署：

```bash
wrangler pages deploy .open-next --project-name=infinite-minds
```

## 📖 使用指南

### 场景 1: 修改 GitHub 仓库代码

1. **打开部署好的网站**
2. **在输入框中输入**:
   ```
   GitHub URL: https://github.com/username/my-project
   任务: 添加健康检查 API 端点
   ```
3. **点击 "Send"**
4. **Agent 工作流**:
   - PM-Bot 分析任务
   - Analyst-Bot 分析仓库结构
   - Dev-Bot 生成代码
   - GitHub API 创建分支 → 提交代码 → 创建 PR
5. **目标仓库自动部署**:
   - PR 合并后触发 GitHub Actions
   - 自动部署到生产环境

### 场景 2: 本地代码生成（不含 GitHub）

1. **输入任务**:
   ```
   创建一个 React 登录组件，包含表单验证
   ```
2. **Agent 生成代码建议**
3. **手动复制使用**

## 🔧 故障排查

### 问题 1: 环境变量未生效

**症状**: API 调用失败，提示 "API_KEY not configured"

**解决方案**:
1. 检查 Cloudflare Dashboard 环境变量配置
2. 确保变量名正确: `ZHIPU_API_KEY`, `GITHUB_TOKEN`
3. 重新部署项目:
   ```bash
   npm run deploy
   ```

### 问题 2: GitHub Token 权限不足

**症状**: 创建 PR 失败，提示 "Resource not accessible"

**解决方案**:
1. 确保授予了 `repo` 权限
2. 检查 Token 是否过期
3. 确保 GitHub App 有权限访问目标仓库

### 问题 3: Agent 响应超时

**症状**: 长时间无响应

**解决方案**:
1. 检查 Zhipu AI API 配额
2. 尝试切换到 `glm-4-flash` 模型（更快）
3. 检查 Cloudflare Workers 日志

### 问题 4: 目标仓库没有自动部署

**症状**: PR 创建成功但没有自动部署

**解决方案**:
1. 确保目标仓库配置了 GitHub Actions
2. 检查 Actions 权限设置
3. 手动触发部署测试

## 🎨 自定义配置

### 修改 AI 模型

编辑 `src/store/agentStore.ts`:

```typescript
const initialLLMConfig: LLMConfig = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '',
  model: 'glm-4', // 或 'glm-4-flash'
};
```

### 添加新的 Agent 角色

编辑 `src/lib/services/zhipu.ts`:

```typescript
const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  // ... 现有角色
  
  custom: `You are Custom-Bot...`,
};
```

## 📊 监控和日志

### Cloudflare Workers 日志

```bash
# 实时查看日志
wrangler tail

# 查看部署日志
# Cloudflare Dashboard → Workers & Pages → 你的项目 → Logs
```

### GitHub Actions 日志

访问目标仓库的 Actions 页面查看部署日志。

## 🔐 安全建议

1. **永远不要在代码中硬编码 API Keys**
2. **定期轮换 Tokens**
3. **限制 GitHub Token 的仓库访问范围**
4. **启用 Cloudflare Workers 的访问日志**
5. **使用 GitHub Protected Branches 保护主分支**

## 📈 成本优化

| 服务 | 免费额度 | 预计成本 |
|------|---------|---------|
| Cloudflare Workers | 100k 请求/天 | $0 (免费) |
| Zhipu AI (glm-4-flash) | - | ¥0.001/1K tokens |
| GitHub Actions | 2000 分钟/月 | $0 (免费) |

**每月估算** (1000 次代码生成):
- Zhipu AI: ~¥5
- Cloudflare + GitHub Actions: $0

## 🚀 下一步

- [ ] 配置多个目标仓库
- [ ] 添加 GitLab 支持
- [ ] 实现代码审查 Agent
- [ ] 添加单元测试生成
- [ ] 支持批量任务处理
