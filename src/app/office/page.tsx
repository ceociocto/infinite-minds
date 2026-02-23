'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskCommandPanel } from '@/components/TaskCommandPanel';
import { MessagePanel } from '@/components/MessagePanel';
// import { TaskList } from '@/components/TaskList';
// import { StatsPanel } from '@/components/StatsPanel'; // 暂时隐藏：无实际数据库存储和统计
import { ResultsPanel } from '@/components/ResultsPanel';
import { AgentScene } from '@/components/AgentScene';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import { getAgentSwarm } from '@/lib/agents/swarm';

export default function OfficePage() {
  const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

  useEffect(() => {
    checkServerConfig();

    // Handle page refresh/close
    const handleBeforeUnload = () => {
      const swarm = getAgentSwarm();
      swarm.cancelMonitoring();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: Cancel any ongoing monitoring when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const swarm = getAgentSwarm();
      swarm.cancelMonitoring();
    };
  }, [checkServerConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">AI Agent Workspace</h1>
          <Link href="/about">
            <Button variant="ghost" size="sm">
              About
            </Button>
          </Link>
        </div>
      </header>

      <section className="py-12 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Agent Collaboration
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Enter task commands below and watch the AI team analyze, assign, and execute them.
              Try our preset scenarios: News Assistant or GitHub Project Modification.
            </p>
          </div>

          {/* Agent Scene Header */}
          <div className="mb-6">
            <AgentScene />
          </div>

          {/* Main Interface Layout */}
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-520px)] min-h-[500px]">
            {/* Left Pane: Controls & Chat */}
            <div className="w-full lg:w-[45%] flex flex-col gap-6 h-full">
              <div className="flex-shrink-0">
                <TaskCommandPanel />
              </div>
              <div className="flex-1 overflow-hidden">
                <MessagePanel />
              </div>
            </div>

            {/* Right Pane: Results Workspace */}
            <div className="w-full lg:w-[55%] h-full">
              <ResultsPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - 暂时隐藏：无实际数据库存储和统计
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <StatsPanel />
        </div>
      </section>
      */}
    </div>
  );
}
