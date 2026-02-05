# Agent Guidelines

This document provides guidelines for AI agents working in this React + TypeScript + Vite codebase.

## Build/Lint/Test Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

**Note:** This project does not have a test framework configured. If adding tests, use Vitest or Jest and document the single test command here (e.g., `npm test -- ComponentName`).

## AI Agent System Architecture

This project implements a multi-agent AI system with real LLM integration via Zhipu AI (智谱AI).

### Core Components

| Component | Path | Description |
|-----------|------|-------------|
| Zhipu AI Service | `src/lib/services/zhipu.ts` | Direct API integration with Zhipu GLM-4 |
| Multi-Agent Orchestrator | `src/lib/services/orchestrator.ts` | Workflow orchestration and task scheduling |
| Agent Swarm | `src/lib/agents/swarm.ts` | Main agent management and coordination |
| Agent Store | `src/store/agentStore.ts` | Zustand state management for agents |

### Agent Roles

- **PM-Bot** (`pm-1`): Project Manager - Coordinates tasks and manages workflow
- **Research-Bot** (`researcher-1`): Researcher - Gathers information and conducts research
- **Writer-Bot** (`writer-1`): Content Writer - Creates and edits written content
- **Translate-Bot** (`translator-1`): Translator - Translates content between languages
- **Dev-Bot** (`dev-1`): Developer - Writes code and builds applications
- **Data-Bot** (`analyst-1`): Data Analyst - Analyzes data and generates insights

### Workflow Types

1. **News Workflow**: Research → Summarize → Translate
2. **GitHub Workflow**: Analyze → Develop → Review → Deploy
3. **General Workflow**: PM Planning → Research → Execute

### Zhipu AI Configuration

To enable real AI capabilities:

1. Get API Key from [Zhipu AI Open Platform](https://open.bigmodel.cn/)
2. Configure in UI via "API Settings" button
3. Supported models:
   - `glm-4-flash` (Fast, cost-effective)
   - `glm-4` (High quality)
   - `glm-4v` (Vision capable)

Default API endpoint: `https://open.bigmodel.cn/api/paas/v4`

### Real-time Updates

The system provides real-time updates via:
- **Message Panel**: Live agent communication log
- **Task List**: Task progress with visual indicators
- **Agent Status**: Real-time status badges and progress bars
- **Progress Tracking**: Per-agent progress percentages

## Code Style Guidelines

### TypeScript

- Use strict TypeScript with proper type annotations
- Prefer interfaces over types for object shapes
- Export types from `src/types/index.ts`
- Use type assertions sparingly (e.g., `as const` for readonly values)

### Imports

- Use path alias `@/` for all imports from `src/` (e.g., `@/components/ui/button`)
- Group imports: React → third-party → local (components → hooks → lib → types)
- Use named exports for components and utilities
- Use `* as React` import pattern for React namespace

### Component Structure

- Use functional components with explicit return types
- Props interface named `{ComponentName}Props`
- Use `React.ComponentProps<"element">` for HTML element props
- Prefer composition with `asChild` prop using Radix Slot
- Components go in `src/components/` or `src/components/ui/`

### Naming Conventions

- Components: PascalCase (e.g., `Button`, `TaskList`)
- Hooks: camelCase starting with `use` (e.g., `useAgentStore`)
- Utilities: camelCase (e.g., `cn`, `formatDate`)
- Types/Interfaces: PascalCase (e.g., `Agent`, `TaskStatus`)
- Constants: UPPER_SNAKE_CASE for true constants
- Files: PascalCase for components, camelCase for utilities

### Styling (Tailwind + shadcn/ui)

- Use Tailwind CSS utility classes
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns for UI components
- Use `class-variance-authority` (cva) for component variants
- Support `className` prop on all components
- Use `data-slot`, `data-variant`, `data-size` attributes

### State Management

- Use Zustand for global state (see `src/store/agentStore.ts`)
- Prefer local state with `useState` for component-specific data
- Use proper TypeScript generics with Zustand stores

### Error Handling

- Use type-safe error handling
- Prefer early returns over nested conditionals
- Log errors to console for debugging
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Performance

- Use `React.memo` for expensive renders
- Memoize callbacks with `useCallback` when passed to children
- Memoize expensive computations with `useMemo`
- Avoid inline object/array creation in render

### File Organization

```
src/
  components/       # React components
    ui/            # shadcn/ui components
  hooks/           # Custom React hooks
  lib/             # Utilities (cn, etc.)
  store/           # Zustand stores
  types/           # TypeScript types
```

### ESLint

- Configuration in `eslint.config.js`
- Uses `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Run `npm run lint` before committing

## Project Stack

- React 19 + TypeScript 5.9
- Vite 7 (build tool)
- Tailwind CSS 3 + shadcn/ui components
- Radix UI primitives
- Zustand (state management)
- Zod (validation)
- Lucide React (icons)
