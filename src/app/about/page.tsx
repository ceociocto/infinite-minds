'use client';

import { useEffect } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { OfficeScene } from '@/components/OfficeScene';
import { useAgentStore } from '@/store/agentStore';
import { Github, Linkedin, Twitter, Mail, Cpu, Palette, Code, BarChart3, Search, FileText, Languages, ArrowRight } from 'lucide-react';
import type { AgentRole } from '@/types';
import Link from 'next/link';
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

export default function AboutPage() {
  const agents = useAgentStore((state) => state.agents);
  const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

  useEffect(() => {
    checkServerConfig();
  }, [checkServerConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <HeroSection />

      <section id="office-section" className="py-20 px-4">
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

          <div className="h-[500px] md:h-[600px] mb-8">
            <OfficeScene />
          </div>

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

          <div className="text-center mt-12">
            <Link href="/">
              <Button
                size="lg"
                className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all rounded-2xl"
              >
                Try Interactive Demo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
