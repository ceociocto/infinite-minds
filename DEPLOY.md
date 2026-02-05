# Cloudflare Deployment Setup

## 自动部署配置

项目已配置 GitHub Actions 工作流，当代码推送到 `main` 分支时会自动部署到 Cloudflare Pages。

## 配置步骤

### 1. 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击右上角头像 → **My Profile**
3. 选择 **API Tokens** 标签
4. 点击 **Create Token**
5. 选择 **Custom token** 模板
6. 配置权限：
   - **Zone:Read** - 用于读取域名信息
   - **Page:Edit** - 用于部署 Pages 项目
7. 点击 **Continue to summary** → **Create Token**
8. 复制生成的 Token

### 2. 获取 Account ID

1. 在 Cloudflare Dashboard 右侧边栏找到 **Account ID**
2. 复制这个 ID

### 3. 配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 添加以下 secrets：

   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Secret**: 刚才复制的 API Token

   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Secret**: 刚才复制的 Account ID

### 4. 创建 Cloudflare Pages 项目

1. 在 Cloudflare Dashboard 中，点击 **Pages**
2. 点击 **Create a project**
3. 选择 **Upload assets**（直接上传）
4. 项目名称填写：`agent-swarm-office`
5. 点击 **Create project**

### 5. 测试部署

配置完成后，推送代码到 main 分支：

```bash
git add .
git commit -m "Setup Cloudflare auto-deployment"
git push origin main
```

GitHub Actions 会自动运行并部署到 Cloudflare Pages。

## 部署状态

- 在 GitHub 仓库的 **Actions** 标签页查看部署状态
- 部署成功后，Cloudflare 会提供访问链接

## 手动部署

如果需要手动部署：

```bash
npm run build
# 然后手动上传 dist/ 目录到 Cloudflare Pages
```
