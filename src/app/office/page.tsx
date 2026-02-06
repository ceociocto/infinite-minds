'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cpu, Palette, Code, BarChart3, Search, FileText, Languages } from 'lucide-react';
import { OfficeScene } from '@/components/OfficeScene';
import { TaskCommandPanel } from '@/components/TaskCommandPanel';
import { MessagePanel } from '@/components/MessagePanel';
import { TaskList } from '@/components/TaskList';
import { StatsPanel } from '@/components/StatsPanel';
import { NewsPanel } from '@/components/NewsPanel';
import { useAgentStore } from '@/store/agentStore';
import type { AgentRole } from '@/types';
import { Button } from '@/components/ui/button';

const roleIcons: Record<AgentRole, typeof Cpu> = {
  pm: Cpu,
  developer: Code,
  designer: Palette,
  analyst: BarChart3,
  researcher: Search,
  writer: FileText,
  translator: Languages,
};

export default function OfficePage() {
  const agents = useAgentStore((state) => state.agents);
  const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

  useEffect(() => {
    checkServerConfig();
  }, [checkServerConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Agent Swarm Office</h1>
          <div className="w-24" />
        </div>
      </header>

      {/* Main Office Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Multi-Agent Office
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Observe how your AI team collaborates in real-time. Each agent has its own role and responsibilities,
              communicating autonomously to distribute tasks and achieve goals together.
            </p>
          </div>

          {/* Office Scene */}
          <div className="h-[500px] md:h-[600px] mb-8">
            <OfficeScene />
          </div>

          {/* Agent Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {agents.map((agent) => {
              const RoleIcon = roleIcons[agent.role];
              return (
                <div
                  key={agent.id}
                  className="glass-panel rounded-2xl p-5 text-center hover:shadow-xl transition-all cursor-pointer agent-card border border-gray-100"
                >
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-20 h-20 object-contain mx-auto mb-4"
                    />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                      <RoleIcon className="w-4 h-4" style={{ color: agent.role === 'pm' ? '#3b82f6' : agent.role === 'developer' ? '#1e293b' : agent.role === 'designer' ? '#ec4899' : agent.role === 'analyst' ? '#10b981' : agent.role === 'researcher' ? '#8b5cf6' : agent.role === 'writer' ? '#f59e0b' : '#06b6d4' }} />
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">{agent.name}</h4>
                  <p className="text-xs text-gray-500 mb-3">{agent.roleName}</p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      agent.status === 'working'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : agent.status === 'thinking'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === 'working'
                          ? 'bg-blue-500 animate-pulse'
                          : agent.status === 'thinking'
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    {agent.status === 'idle' && 'Idle'}
                    {agent.status === 'working' && 'Working'}
                    {agent.status === 'thinking' && 'Thinking'}
                    {agent.status === 'completed' && 'Completed'}
                    {agent.status === 'error' && 'Error'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
