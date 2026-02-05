# Agent Swarm Office

A Next.js-based multi-agent system that demonstrates real AI agent collaboration for complex tasks.

## Features

### Multi-Agent Swarm System
- **6 Specialized Agents**: PM, Researcher, Writer, Translator, Developer, Analyst
- **Real-time Collaboration**: Watch agents communicate and coordinate tasks
- **Visual Office Environment**: 3D isometric office with animated agent characters

### Two Working Scenarios

#### 1. News Assistant
- **Researcher** collects recent AI product news from China market
- **Writer** summarizes the collected information
- **Translator** translates the summary to English
- **PM** coordinates the entire workflow

#### 2. GitHub Project Modification
- **Analyst** clones and analyzes the repository structure
- **Developer** modifies code based on requirements
- **PM** coordinates deployment to Cloudflare
- Default repo: `https://github.com/ceociocto/investment-advisor.git`

### Voice Input Support
- Click the microphone button to use voice commands
- Supports Chinese speech recognition
- Real-time transcription

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Deployment**: Cloudflare Pages (Static Export)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

The static export will be generated in the `dist` directory.

### Deploy to Cloudflare

```bash
npm run deploy
```

Or manually upload the `dist` folder to Cloudflare Pages.

## Usage

1. **Enter the Office**: Click "Enter Office" to see the agent swarm visualization
2. **Run Scenarios**:
   - Click "News Assistant" to run the news collection workflow
   - Click "GitHub Project" to run the code modification workflow
3. **Voice Commands**: Click the microphone icon and speak your command
4. **Watch Collaboration**: Observe real-time messages and task progress

## Architecture

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── HeroSection.tsx
│   ├── OfficeScene.tsx
│   ├── TaskCommandPanel.tsx
│   ├── MessagePanel.tsx
│   ├── TaskList.tsx
│   ├── StatsPanel.tsx
│   └── AgentCharacter.tsx
├── lib/
│   └── agents/
│       └── swarm.ts       # Agent swarm orchestrator
├── store/
│   └── agentStore.ts      # Zustand state management
└── types/
    └── index.ts           # TypeScript types
```

## Agent Roles

| Agent | Role | Responsibility |
|-------|------|----------------|
| PM-Bot | Project Manager | Coordinates tasks and workflow |
| Research-Bot | Researcher | Gathers information and news |
| Writer-Bot | Content Writer | Creates summaries and content |
| Translate-Bot | Translator | Translates between languages |
| Dev-Bot | Developer | Writes and modifies code |
| Data-Bot | Analyst | Analyzes data and repositories |

## License

MIT
