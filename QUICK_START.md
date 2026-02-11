# 🚀 快速启动指南 - AI Coding Agent

## 📖 三分钟上手

### 第一步：配置 API Keys

在 Cloudflare 环境变量中设置：

```bash
ZHIPU_API_KEY=your-zhipu-api-key-here
GITHUB_TOKEN=ghp_your-github-token-here
```

**获取方式：**
- Zhipu AI: https://open.bigmodel.cn/
- GitHub Token: https://github.com/settings/tokens

---

### 第二步：本地测试

```bash
# 1. 安装依赖
npm install

# 2. 创建 .dev.vars 文件
echo "ZHIPU_API_KEY=your-key" > .dev.vars
echo "GITHUB_TOKEN=ghp_your-token" >> .dev.vars

# 3. 启动开发服务器
npm run dev

# 4. 访问 http://localhost:3000
```

---

### 第三步：部署到 Cloudflare

```bash
# 构建
npm run build

# 部署
npm run deploy
```

---

## 🎯 使用场景

### 场景 1: 修改 GitHub 项目（自动 PR + 部署）

**输入：**
```
GitHub URL: https://github.com/your-username/your-project
任务: 添加健康检查 API，返回 { status: "ok", timestamp }
```

**执行流程：**
```
1. ✅ PM-Bot 分析任务
2. ✅ Analyst-Bot 分析仓库结构
3. ✅ Dev-Bot 生成代码
4. ✅ GitHub API 创建分支
5. ✅ 提交代码到新分支
6. ✅ 创建 Pull Request
7. ✅ GitHub Actions 自动部署
```

**结果：**
- 新分支: `ai-update-xxxxx`
- 新文件: `src/app/api/health/route.ts`
- PR 链接显示在界面中

---

### 场景 2: 快速代码生成

**输入：**
```
创建一个 Next.js 15 的 API 路由，实现用户注册功能
```

**执行流程：**
```
1. ✅ PM-Bot 识别为开发任务
2. ✅ Analyst-Bot 分析需求
3. ✅ Dev-Bot 生成完整代码
4. ✅ PM-Bot 审查代码质量
```

**结果：**
- 完整的 API 代码
- 数据验证
- 错误处理

---

## 🎨 界面功能

### Command Panel（命令面板）

```
┌─────────────────────────────────────┐
│  🔧 Command Center                  │
│  ✅ AI Ready  ✅ GitHub Ready      │
│                                     │
│  [News] [GitHub Project]           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ GitHub URL 输入框            │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 任务描述输入框              │   │
│  │                             │   │
│  │                  [🎤] [Send]│   │
│  └─────────────────────────────┘   │
│                                     │
│  Agent Status:                      │
│  • PM-Bot: Working 45%             │
│  • Dev-Bot: Idle                   │
└─────────────────────────────────────┘
```

---

## 📊 Agent 工作流详解

### GitHub 项目修改工作流

```
用户输入
  │
  ├─> 解析 GitHub URL
  │   └─> https://github.com/user/repo
  │
  ├─> 获取仓库文件结构
  │   └─> /src, /app, package.json
  │
  ├─> Agent 协作
  │   ├─> PM: 分析任务类型
  │   ├─> Analyst: 分析技术栈
  │   ├─> Dev: 生成代码
  │   └─> PM: 审查代码
  │
  └─> GitHub 操作
      ├─> 创建分支: ai-update-timestamp
      ├─> 提交文件: 3 个新文件
      └─> 创建 PR: #123
```

### 代码生成工作流（本地）

```
用户输入
  │
  ├─> PM: 识别为开发任务
  │
  ├─> Analyst: 需求分析
  │   ├─> 需要什么组件
  │   ├─> 技术栈要求
  │   └─> 文件结构
  │
  ├─> Dev: 代码生成
  │   ├─> 组件代码
  │   ├─> 样式定义
  │   └─→ 导出语句
  │
  └─> PM: 代码审查
      ├─> 检查规范
      ├─> 最佳实践
      └─> 改进建议
```

---

## 🔧 配置选项

### API 设置

点击 **API Settings** 按钮：

```
┌─────────────────────────────┐
│  Zhipu AI Configuration     │
│                             │
│  API URL                     │
│  https://open.bigmodel.cn    │
│                             │
│  API Key                     │
│  •••••••••••••••            │
│                             │
│  Model                       │
│  [glm-4-flash] ▼            │
│                             │
│  [Test AI] [Save]           │
└─────────────────────────────┘
```

### 模型选择

| 模型 | 速度 | 成本 | 推荐场景 |
|------|------|------|---------|
| `glm-4-flash` | ⚡ 快 | ¥0.001/1K tokens | 日常开发 |
| `glm-4` | 🐌 慢 | ¥0.05/1K tokens | 复杂任务 |

---

## 🎯 快速命令

点击快速命令按钮直接填入：

```
[📰 Collect AI News]
     ↓
"Collect recent China AI market news"

[🐙 Modify GitHub Project]
     ↓
"Clone and modify https://github.com/user/repo"

[🎨 Design Logo]
     ↓
"Design a modern minimalist logo"

[🔐 Build Login Page]
     ↓
"Develop user login page with validation"
```

---

## 📈 实时进度

```
Agent Status Panel:

┌──────────────────────────┐
│ 🤖 PM-Bot                │
│ Status: Working █████ 45%│
└──────────────────────────┘

┌──────────────────────────┐
│ 💻 Dev-Bot               │
│ Status: Working ██████60%│
└──────────────────────────┘

┌──────────────────────────┐
│ 📊 Analyst-Bot           │
│ Status: Completed 100%   │
└──────────────────────────┘
```

---

## 💡 最佳实践

### ✅ DO（推荐做法）

1. **明确任务描述**
   ```
   ✅ "创建 /api/health 路由，返回状态和时间戳"
   ❌ "添加个 API"
   ```

2. **使用 GitHub URL**
   ```
   ✅ "https://github.com/user/repo 添加登录功能"
   ❌ "那个仓库添加个登录"
   ```

3. **分步骤复杂任务**
   ```
   ✅ 第一步："创建用户模型"
      第二步："创建注册 API"
   ❌ "创建完整的用户系统包括注册登录..."
   ```

### ❌ DON'T（不推荐做法）

1. **不要粘贴图片** - 当前版本不支持
2. **不要在任务中包含敏感信息**
3. **不要一次要求太多功能** - 分步骤执行

---

## 🐛 常见问题

**Q: AI 不响应？**
- 检查 API Key 是否配置
- 查看 Cloudflare Workers 日志

**Q: GitHub 操作失败？**
- 确认 Token 有 `repo` 权限
- 检查仓库是否存在

**Q: 代码质量不好？**
- 尝试使用 `glm-4` 模型
- 在任务描述中增加更多细节

**Q: 部署后访问不了？**
- 等待 Cloudflare 部署完成（~2分钟）
- 检查环境变量是否设置

---

## 🚀 下一步

- 📖 阅读 [完整部署指南](./CLOUDFLARE_DEPLOYMENT.md)
- 🔧 查看 [项目架构](./AGENTS.md)
- 🌟 在 GitHub 上 Star 这个项目

---

**技术支持**: 打开 Issue 或查看文档
**更新日志**: 2025-02-11 - 初始版本
