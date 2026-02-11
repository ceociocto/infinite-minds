# Agent Guidelines

This document provides guidelines for AI agents working in this React + TypeScript + Next.js codebase.

## Build/Lint/Test Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Deploy to Cloudflare (OpenNext.js)
npm run deploy
```

**Note:** This project does not have a test framework configured. If adding tests, use Vitest and document the single test command here (e.g., `npm test -- ComponentName`).

## Project Stack

- **Next.js 15** with App Router (`src/app/`)
- **React 19** + **TypeScript 5.9**
- **Tailwind CSS 3** + **shadcn/ui** components
- **Radix UI** primitives
- **Zustand** (state management)
- **Zod** (validation)
- **Lucide React** (icons)
- **Cloudflare Workers** deployment via OpenNext.js

## Code Style Guidelines

### TypeScript

- Strict mode enabled in `tsconfig.json`
- Use proper type annotations on all functions and components
- Export types from `src/types/index.ts`
- Use type assertions sparingly (prefer `as const` for readonly values)
- Prefer interfaces for object shapes that may be extended
- Use `type` for unions, intersections, and utility types

### Imports

- Use path alias `@/` for all imports from `src/` (e.g., `@/components/ui/button`)
- Group imports: React → third-party → local (components → hooks → lib → types)
- Use named exports for components and utilities
- Use `import * as React` or `import React from 'react'` for React namespace
- Use `import type { X }` for type-only imports

### Component Structure

```tsx
'use client'; // For client components

import React from 'react';
import { SomeComponent } from '@/components/SomeComponent';
import { useSomeHook } from '@/hooks/useSomeHook';

interface ComponentNameProps {
  // prop definitions
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // Component logic
  return <div>...</div>;
};
```

- Use functional components with explicit `React.FC` type or `React.ComponentProps`
- Props interface named `{ComponentName}Props`
- Use `React.ComponentProps<"element">` for HTML element props extension
- Client components must include `'use client';` directive
- Components go in `src/components/` or `src/components/ui/`

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `TaskList`)
- **Hooks**: camelCase starting with `use` (e.g., `useAgentStore`, `useSomeHook`)
- **Utilities**: camelCase (e.g., `cn`, `formatDate`)
- **Types/Interfaces**: PascalCase (e.g., `Agent`, `TaskStatus`, `AgentRole`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities (`utils.ts`)
- **Folders**: camelCase or kebab-case

### Styling (Tailwind + shadcn/ui)

- Use Tailwind CSS utility classes
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns for UI components
- Use `class-variance-authority` (cva) for component variants
- Support `className` prop on all components
- Use `data-slot`, `data-variant`, `data-size` attributes for styling hooks
- Prefer native Tailwind over inline styles

### State Management

- Use Zustand for global state (see `src/store/agentStore.ts`)
- Store files go in `src/store/`
- Prefer local state with `useState` for component-specific data
- Use proper TypeScript generics with Zustand stores
- Use `create<StoreType>((set, get) => ({ ... }))` pattern

### Error Handling

- Use type-safe error handling with proper error types
- Prefer early returns over nested conditionals
- Log errors to console for debugging
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators
- Wrap async operations in try-catch blocks

### Performance

- Use `React.memo` for expensive renders
- Memoize callbacks with `useCallback` when passed to children
- Memoize expensive computations with `useMemo`
- Avoid inline object/array creation in render (extract to variables)
- Use dynamic imports for code splitting

### File Organization

```
src/
  app/              # Next.js App Router pages and layouts
  components/       # React components
    ui/            # shadcn/ui components
  hooks/           # Custom React hooks
  lib/             # Utilities and services
    agents/        # Agent-related logic
    services/      # API services (zhipu, github, etc.)
  store/           # Zustand stores
  types/           # TypeScript types
```

### ESLint

- Configuration in `eslint.config.mjs`
- Uses `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Run `npm run lint` before committing
- Run `npm run lint:fix` to auto-fix issues

## AI Agent System Architecture

This project implements a multi-agent AI system with real LLM integration.

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

### Zhipu AI Configuration

Default API endpoint: `https://open.bigmodel.cn/api/paas/v4`

Supported models:
- `glm-4-flash` (Fast, cost-effective)
- `glm-4` (High quality)
- `glm-4v` (Vision capable)
