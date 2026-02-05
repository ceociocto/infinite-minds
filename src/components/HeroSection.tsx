'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Bot, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Animate title characters
    const title = titleRef.current;
    if (!title) return;

    const text = title.textContent || '';
    title.innerHTML = text
      .split('')
      .map((char, i) =>
        char === ' '
          ? ' '
          : `<span class="inline-block opacity-0 translate-y-4" style="animation: fadeInUp 0.6s ${
              i * 0.05
            }s forwards">${char}</span>`
      )
      .join('');
  }, []);

  const scrollToOffice = () => {
    const officeSection = document.getElementById('office-section');
    officeSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 isometric-grid opacity-30" />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][
                i % 5
              ],
              opacity: 0.25,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg mb-8 animate-fade-in border border-gray-100">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">
            Agent Swarm System
          </span>
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight"
        >
          Agent Swarm Office
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Multi-Agent Collaboration for Complex Tasks
        </p>
        <p className="text-base text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          Experience the power of agent swarm systems. Multiple AI agents work together 
          to collect news, write content, translate languages, modify code, and deploy projects.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all rounded-2xl"
            onClick={scrollToOffice}
          >
            <Bot className="w-5 h-5" />
            Enter Office
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-lg px-8 py-6 border-2 rounded-2xl"
            onClick={() => {
              const demoSection = document.getElementById('demo-section');
              demoSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Workflow className="w-5 h-5" />
            Watch Demo
          </Button>
        </div>

        {/* Agent Preview */}
        <div className="mt-16 flex justify-center gap-3 md:gap-6 flex-wrap">
          {[
            { img: '/agent-pm.png', name: 'PM-Bot', color: '#3b82f6' },
            { img: '/agent-researcher.png', name: 'Research-Bot', color: '#8b5cf6' },
            { img: '/agent-writer.png', name: 'Writer-Bot', color: '#f59e0b' },
            { img: '/agent-translator.png', name: 'Translate-Bot', color: '#06b6d4' },
            { img: '/agent-dev.png', name: 'Dev-Bot', color: '#1e293b' },
            { img: '/agent-analyst.png', name: 'Data-Bot', color: '#10b981' },
          ].map((agent, i) => (
            <div
              key={agent.name}
              className="group relative animate-float"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
                style={{ boxShadow: `0 10px 40px ${agent.color}25` }}
              >
                <img
                  src={agent.img}
                  alt={agent.name}
                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                />
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-white px-3 py-1 rounded-full shadow-lg">
                {agent.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
};
