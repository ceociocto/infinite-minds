'use client';

import React, { useState, useEffect } from 'react';
import type { Agent } from '@/types';
import { AGENT_ROLES } from '@/types';
import { useAgentStore } from '@/store/agentStore';
import { Cpu, MessageSquare, CheckCircle, Search, FileText, Languages, Code, BarChart3 } from 'lucide-react';

interface AgentCharacterProps {
  agent: Agent;
  scale?: number;
  showDetails?: boolean;
}

const statusAnimation: Record<Agent['status'], string> = {
  idle: 'animate-float',
  working: 'animate-working',
  thinking: 'animate-thinking',
  completed: 'animate-bounce',
  error: 'animate-pulse',
};

const statusColor: Record<Agent['status'], string> = {
  idle: 'text-gray-400',
  working: 'text-blue-500',
  thinking: 'text-amber-500',
  completed: 'text-green-500',
  error: 'text-red-500',
};

const statusText: Record<Agent['status'], string> = {
  idle: 'Idle',
  working: 'Working',
  thinking: 'Thinking',
  completed: 'Completed',
  error: 'Error',
};

const roleIcons: Record<Agent['role'], typeof Cpu> = {
  pm: Cpu,
  developer: Code,
  designer: Code,
  analyst: BarChart3,
  researcher: Search,
  writer: FileText,
  translator: Languages,
};

export const AgentCharacter: React.FC<AgentCharacterProps> = ({
  agent,
  scale = 1,
  showDetails = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const setSelectedAgent = useAgentStore((state) => state.setSelectedAgent);
  const selectedAgent = useAgentStore((state) => state.selectedAgent);
  const messages = useAgentStore((state) => state.messages);

  const isSelected = selectedAgent === agent.id;
  const roleInfo = AGENT_ROLES[agent.role];
  const RoleIcon = roleIcons[agent.role];

  // Show speech bubble for recent messages from this agent
  useEffect(() => {
    const recentMessage = messages
      .filter((m) => m.from === agent.id && m.type !== 'system')
      .slice(-1)[0];
    
    if (recentMessage) {
      setSpeechBubble(recentMessage.content);
      const timer = setTimeout(() => setSpeechBubble(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [messages, agent.id]);

  return (
    <div
      className={`absolute transition-all duration-500 cursor-pointer ${
        statusAnimation[agent.status]
      }`}
      style={{
        left: `${agent.position.x}%`,
        top: `${agent.position.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        zIndex: isHovered || isSelected ? 50 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
    >
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 animate-message-pop">
          <div className="relative bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 max-w-[200px]">
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{speechBubble}</p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Status Ring */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        }`}
        style={{
          width: '140px',
          height: '140px',
          left: '-20px',
          top: '-20px',
          boxShadow: isHovered
            ? `0 0 40px ${roleInfo.color}50`
            : `0 0 15px ${roleInfo.color}30`,
        }}
      />

      {/* Agent Avatar */}
      <div className="relative w-[100px] h-[100px]">
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-full h-full object-contain drop-shadow-xl"
        />

        {/* Status Indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${statusColor[agent.status]}`}
        >
          {agent.status === 'working' && (
            <Cpu className="w-3.5 h-3.5 text-white animate-spin" />
          )}
          {agent.status === 'thinking' && (
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          )}
          {agent.status === 'completed' && (
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          )}
          {agent.status === 'idle' && (
            <div className="w-2.5 h-2.5 rounded-full bg-current" />
          )}
        </div>

        {/* Role Badge */}
        <div
          className="absolute -top-2 -left-2 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg"
          style={{ backgroundColor: roleInfo.color }}
        >
          {agent.role.toUpperCase()}
        </div>
      </div>

      {/* Agent Info Card */}
      {(isHovered || isSelected) && showDetails && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-56 glass-panel rounded-2xl p-4 shadow-2xl animate-message-pop border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${roleInfo.color}20` }}
            >
              <img src={agent.avatar} alt={agent.name} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="font-bold text-gray-800">{agent.name}</div>
              <div
                className="text-xs font-medium"
                style={{ color: roleInfo.color }}
              >
                {agent.roleName}
              </div>
            </div>
          </div>

          <div className={`text-xs font-semibold mb-3 px-2 py-1 rounded-lg ${statusColor[agent.status]} bg-opacity-10`} 
               style={{ backgroundColor: `${roleInfo.color}15` }}>
            {statusText[agent.status]}
          </div>

          {agent.currentTask && (
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Current Task</div>
              <div className="text-xs font-medium text-gray-800 truncate mb-2">
                {agent.currentTask.title}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${agent.currentTask.progress}%`,
                    background: `linear-gradient(90deg, ${roleInfo.color}, ${roleInfo.color}80)`
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Done</div>
              <div className="text-sm font-bold text-gray-800">
                {agent.stats.tasksCompleted}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Efficiency</div>
              <div className="text-sm font-bold text-green-600">
                {agent.stats.efficiency}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Collab</div>
              <div className="text-sm font-bold text-blue-600">
                {agent.stats.collaboration}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
