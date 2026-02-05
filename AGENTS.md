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
