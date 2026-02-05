'use client';

import React, { useEffect, useRef } from 'react';
import { AgentCharacter } from './AgentCharacter';
import { useAgentStore } from '@/store/agentStore';
import { Activity, BarChart3 } from 'lucide-react';

export const OfficeScene: React.FC = () => {
  const agents = useAgentStore((state) => state.agents);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Parallax effect on mouse move
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      scene.style.transform = `perspective(1000px) rotateX(${y * -5}deg) rotateY(${x * 5}deg)`;
    };

    const handleMouseLeave = () => {
      scene.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    };

    scene.addEventListener('mousemove', handleMouseMove);
    scene.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      scene.removeEventListener('mousemove', handleMouseMove);
      scene.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const workingAgents = agents.filter((a) => a.status === 'working').length;
  const totalCompleted = agents.reduce((sum, a) => sum + a.stats.tasksCompleted, 0);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl shadow-inner border border-gray-100">
      {/* Grid Background */}
      <div className="absolute inset-0 isometric-grid animate-grid-flow opacity-40" />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-400/20 animate-particle"
            style={{
              left: `${10 + (i * 6) % 80}%`,
              top: `${15 + (i * 10) % 70}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Scene Container with 3D perspective */}
      <div
        ref={sceneRef}
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Office Floor - Isometric View */}
        <div
          className="absolute inset-12 bg-white/90 rounded-3xl shadow-2xl border border-gray-100"
          style={{
            transform: 'rotateX(55deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Floor Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="floorGrid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#floorGrid)" />
            </svg>
          </div>

          {/* Workstation Zones */}
          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center"
            style={{ left: '8%', top: '10%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-blue-600">PM Desk</span>
          </div>

          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 flex items-center justify-center"
            style={{ left: '35%', top: '8%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-violet-600">Research</span>
          </div>

          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center"
            style={{ left: '62%', top: '12%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-amber-600">Writing</span>
          </div>

          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 flex items-center justify-center"
            style={{ left: '12%', top: '40%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-cyan-600">Translation</span>
          </div>

          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center"
            style={{ left: '42%', top: '38%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-slate-600">Dev Station</span>
          </div>

          <div
            className="absolute w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center"
            style={{ left: '70%', top: '45%', transform: 'translateZ(30px)' }}
          >
            <span className="text-xs font-semibold text-emerald-600">Analytics</span>
          </div>

          {/* Meeting Room */}
          <div
            className="absolute w-36 h-24 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center"
            style={{ left: '30%', top: '65%', transform: 'translateZ(40px)' }}
          >
            <span className="text-xs font-semibold text-amber-600">Meeting Room</span>
          </div>
        </div>

        {/* Agents Layer */}
        <div className="absolute inset-0">
          {agents.map((agent) => (
            <AgentCharacter
              key={agent.id}
              agent={agent}
              scale={0.75}
            />
          ))}
        </div>

        {/* Connection Lines SVG */}
        <svg className="absolute inset-0 pointer-events-none opacity-30">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {/* Dynamic connection lines between agents */}
          {workingAgents > 1 && (
            <>
              <line
                x1="20%"
                y1="30%"
                x2="50%"
                y2="25%"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
              <line
                x1="50%"
                y1="25%"
                x2="75%"
                y2="40%"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="animate-pulse"
                style={{ animationDelay: '0.5s' }}
              />
            </>
          )}
        </svg>
      </div>

      {/* Overlay Info Cards */}
      <div className="absolute top-6 left-6 glass-panel rounded-2xl px-5 py-3 shadow-lg border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Agent Swarm Office</div>
            <div className="text-xs text-gray-500">{workingAgents} agents working</div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 glass-panel rounded-2xl px-5 py-3 shadow-lg border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Today's Progress</div>
            <div className="text-xs text-gray-500">{totalCompleted} tasks completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
