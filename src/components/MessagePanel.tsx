'use client';

import React, { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { MessageCircle, Bot, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const MessagePanel: React.FC = () => {
  const messages = useAgentStore((state) => state.messages);
  const agents = useAgentStore((state) => state.agents);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getAgentInfo = (agentId: string) => {
    if (agentId === 'all' || agentId === 'user') {
      return { name: agentId === 'user' ? 'You' : 'System', avatar: '', color: '#6b7280' };
    }
    const agent = agents.find((a) => a.id === agentId);
    return agent
      ? { name: agent.name, avatar: agent.avatar, color: '#3b82f6' }
      : { name: agentId, avatar: '', color: '#6b7280' };
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-xl border border-white/50 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Live Communications</h3>
            <p className="text-xs text-gray-500">Agent collaboration in real-time</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {messages.length} messages
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="w-14 h-14 mb-3 opacity-20" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Issue a task to see agent collaboration</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const fromInfo = getAgentInfo(message.from);
            const isSystem = message.type === 'system';
            const isResult = message.type === 'result';
            const isUser = message.from === 'user';

            return (
              <div
                key={message.id}
                className={`animate-message-pop flex gap-3 ${
                  isSystem ? 'justify-center' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {isSystem ? (
                  <div className="px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700 max-w-[85%] text-center border border-blue-100">
                    {message.content}
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      {fromInfo.avatar ? (
                        <img
                          src={fromInfo.avatar}
                          alt={fromInfo.name}
                          className="w-9 h-9 object-contain"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isUser ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <User className={`w-4 h-4 ${isUser ? 'text-blue-500' : 'text-gray-500'}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: isUser ? '#3b82f6' : fromInfo.color }}
                        >
                          {fromInfo.name}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(message.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                      <div className={`text-sm rounded-xl px-4 py-2.5 break-words border ${
                        isResult 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800' 
                          : isUser
                          ? 'bg-blue-50 border-blue-100 text-gray-700'
                          : 'bg-gray-50 border-gray-100 text-gray-700'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
