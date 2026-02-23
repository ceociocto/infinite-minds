'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { Send, Sparkles, Bot, Loader2, Mic, MicOff, CheckCircle, AlertCircle, Github, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const TaskCommandPanel: React.FC = () => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const executeTask = useAgentStore((state) => state.executeTask);
  const agents = useAgentStore((state) => state.agents);
  const isExecuting = useAgentStore((state) => state.isExecuting);
  const hasRealAI = useAgentStore((state) => state.hasRealAI);
  const agentProgress = useAgentStore((state) => state.agentProgress);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);



  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const [selectedRepo, setSelectedRepo] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;

    try {
      const lowerCommand = command.toLowerCase();
      // 判断是否是新闻、投资等非代码域任务
      const isQuickInvestment = command === '生成全球AI与加密货币投资简报';
      const isQuickNews = command === 'Search for the most important AI news and trends in China today';

      const isContentTask = isQuickInvestment || isQuickNews;

      const isDevTask = lowerCommand.includes('api') ||
        lowerCommand.includes('端点') ||
        lowerCommand.includes('endpoint') ||
        lowerCommand.includes('route') ||
        lowerCommand.includes('创建') ||
        lowerCommand.includes('添加') ||
        lowerCommand.includes('实现') ||
        lowerCommand.includes('开发') ||
        lowerCommand.includes('修改代码') ||
        lowerCommand.includes('增加功能');

      // 或者判断是否包含github链接，如果已经包含说明用户自己输入了
      const hasGithubUrl = command.includes('github.com');

      let fullCommand = command;

      // 如果意图是修改代码或功能，且没有自带github链接
      if (isDevTask && !hasGithubUrl) {
        if (!selectedRepo) {
          toast.error('请选择一个目标代码仓库 (Please select a target repository)');
          return;
        }
        fullCommand = `${selectedRepo} ${command}`;
      } else if (!isContentTask && !isDevTask && !hasGithubUrl && selectedRepo) {
        // 对于其他未明确分类的任务，如果选了仓库，也可以带上
        fullCommand = `${selectedRepo} ${command}`;
      }

      await executeTask(fullCommand);
      setCommand('');
    } catch (error) {
      console.error('Task execution failed:', error);
      toast.error('Task execution failed');
    }
  };

  const repositories = [
    { label: 'investment-advisor', value: 'https://github.com/ceociocto/investment-advisor/' },
    { label: 'pet', value: 'https://github.com/ceociocto/noman' },
  ];

  const quickCommands = [
    { label: 'Global Investment Briefing', value: '生成全球AI与加密货币投资简报', icon: Sparkles },
    { label: 'China AI Daily Headlines', value: 'Search for the most important AI news and trends in China today', icon: Newspaper },
    { label: 'Design Logo', value: 'Design a modern minimalist company logo' },
    { label: 'Build Login Page', value: 'Develop a user login page with form validation' },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-lg">Command Center</h3>
              {hasRealAI ? (
                <Badge variant="default" className="bg-green-500 text-white text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  AI Ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Simulated
                </Badge>
              )}

            </div>
            <p className="text-xs text-gray-500">Issue commands to your AI team</p>
          </div>
        </div>


      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        {/* Repository Selector */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Github className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Target Repository</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {repositories.map((repo) => (
              <button
                key={repo.value}
                type="button"
                onClick={() => setSelectedRepo(selectedRepo === repo.value ? '' : repo.value)}
                className={`px-4 py-2 text-xs rounded-full transition-all border ${selectedRepo === repo.value
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                disabled={isExecuting}
              >
                {repo.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter your task command, or use voice input..."
            className="min-h-[100px] resize-none pr-32 text-sm rounded-2xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            disabled={isExecuting}
          />

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`absolute bottom-3 right-28 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <Button
            type="submit"
            size="sm"
            className="absolute bottom-3 right-3 gap-1 rounded-xl"
            disabled={!command.trim() || isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </div>

        {/* Voice Listening Indicator */}
        {isListening && (
          <div className="flex items-center gap-2 text-sm text-red-500 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Listening... Speak now
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {quickCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCommand(cmd.value)}
                className="px-4 py-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-600 transition-all border border-gray-200 hover:border-blue-200 flex items-center gap-1.5"
                disabled={isExecuting}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {cmd.label}
              </button>
            );
          })}
        </div>
      </form>

    </div>
  );
};
