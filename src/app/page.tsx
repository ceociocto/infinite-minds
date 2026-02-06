'use client';

import { useEffect } from 'react';
import { TaskCommandPanel } from '@/components/TaskCommandPanel';
import { MessagePanel } from '@/components/MessagePanel';
import { TaskList } from '@/components/TaskList';
import { StatsPanel } from '@/components/StatsPanel';
import { NewsPanel } from '@/components/NewsPanel';
import { useAgentStore } from '@/store/agentStore';
import { Github, Linkedin, Twitter, Mail, Cpu, Palette, Code, BarChart3, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

  useEffect(() => {
    checkServerConfig();
  }, [checkServerConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header with About Link */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Agent Swarm Office
          </h1>
          <Link href="/about">
            <Button variant="outline" size="sm" className="gap-2">
              <Info className="w-4 h-4" />
              About
            </Button>
          </Link>
        </div>
      </header>

      {/* Demo Section */}
      <section id="demo-section" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
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
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <StatsPanel />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Capabilities
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A new way of working powered by multi-agent systems
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Cpu,
                title: 'Autonomous Task Management',
                description: 'Agents can analyze tasks, create plans, and execute them independently',
                color: '#3b82f6',
              },
              {
                icon: Code,
                title: 'Real-Time Collaboration',
                description: 'Agents communicate with each other to coordinate work',
                color: '#1e293b',
              },
              {
                icon: BarChart3,
                title: 'Intelligent Analytics',
                description: 'Automatically analyze data, generate reports, and provide insights',
                color: '#10b981',
              },
              {
                icon: Palette,
                title: 'Seamless Integration',
                description: 'Easily connect to your LLM API and existing workflows',
                color: '#ec4899',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="glass-panel rounded-2xl p-6 text-center hover:shadow-xl transition-all group border border-gray-100"
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Agent Swarm Office
              </h3>
              <p className="text-sm text-gray-500">
                Explore the future of AI-powered collaboration
              </p>
            </div>

            <div className="flex gap-3">
              {[
                { icon: Github, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Linkedin, href: '#' },
                { icon: Mail, href: '#' },
              ].map((social, i) => {
                const Icon = social.icon;
                return (
                  <a
                    key={i}
                    href={social.href}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            &copy; 2024 Agent Swarm Office. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
