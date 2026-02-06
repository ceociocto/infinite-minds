'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TaskCommandPanel } from '@/components/TaskCommandPanel';
import { MessagePanel } from '@/components/MessagePanel';
import { TaskList } from '@/components/TaskList';
import { StatsPanel } from '@/components/StatsPanel';
import { NewsPanel } from '@/components/NewsPanel';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';

export default function OfficePage() {
  const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

  useEffect(() => {
    checkServerConfig();
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
          <h1 className="text-xl font-bold text-gray-900">Interactive Demo Workspace</h1>
          <Link href="/about">
            <Button variant="ghost" size="sm">
              About
            </Button>
          </Link>
        </div>
      </header>

      {/* Demo Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Interactive Demo
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Enter task commands below and watch the AI team analyze, assign, and execute them.
              Try our preset scenarios: News Assistant or GitHub Project Modification.
            </p>
          </div>

          {/* Command Panel */}
          <div className="mb-8">
            <TaskCommandPanel />
          </div>

          {/* Dashboard Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <MessagePanel />
            </div>
            <NewsPanel />
          </div>
          <div className="mt-6">
            <TaskList />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <StatsPanel />
        </div>
      </section>
    </div>
  );
}
