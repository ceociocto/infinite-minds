'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { Send, Sparkles, Settings, Bot, Loader2, Mic, MicOff, Newspaper, Github, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export const TaskCommandPanel: React.FC = () => {
  const [command, setCommand] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const executeTask = useAgentStore((state) => state.executeTask);
  const executeNewsScenario = useAgentStore((state) => state.executeNewsScenario);
  const executeGitHubScenario = useAgentStore((state) => state.executeGitHubScenario);
  const setLLMConfig = useAgentStore((state) => state.setLLMConfig);
  const agents = useAgentStore((state) => state.agents);
  const isExecuting = useAgentStore((state) => state.isExecuting);
  const resetSwarm = useAgentStore((state) => state.resetSwarm);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isExecuting) return;

    try {
      await executeTask(command);
      setCommand('');
    } catch (error) {
      console.error('Task execution failed:', error);
    }
  };

  const handleNewsScenario = async () => {
    if (isExecuting) return;
    try {
      await executeNewsScenario();
    } catch (error) {
      console.error('News scenario failed:', error);
    }
  };

  const handleGitHubScenario = async () => {
    if (isExecuting) return;
    try {
      await executeGitHubScenario();
    } catch (error) {
      console.error('GitHub scenario failed:', error);
    }
  };

  const handleSaveConfig = () => {
    setLLMConfig({ apiUrl, apiKey, model });
  };

  const quickCommands = [
    { label: 'Collect AI News', value: 'Collect recent China AI market news and translate to English', icon: Newspaper },
    { label: 'Modify GitHub Project', value: 'Clone and modify https://github.com/ceociocto/investment-advisor.git', icon: Github },
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
            <h3 className="font-bold text-gray-800 text-lg">Command Center</h3>
            <p className="text-xs text-gray-500">Issue commands to your AI team</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={resetSwarm}
            disabled={isExecuting}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                <Settings className="w-4 h-4" />
                API Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>LLM API Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://api.openai.com/v1"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="gpt-4"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button onClick={handleSaveConfig} className="w-full rounded-xl">
                  Save Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scenario Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="outline"
          className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-2xl border-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
          onClick={handleNewsScenario}
          disabled={isExecuting}
        >
          <Newspaper className="w-6 h-6 text-blue-500" />
          <div className="text-center">
            <div className="font-semibold text-sm">News Assistant</div>
            <div className="text-xs text-gray-500">Collect & Translate</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 px-4 flex flex-col items-center gap-2 rounded-2xl border-2 hover:border-purple-400 hover:bg-purple-50 transition-all"
          onClick={handleGitHubScenario}
          disabled={isExecuting}
        >
          <Github className="w-6 h-6 text-purple-500" />
          <div className="text-center">
            <div className="font-semibold text-sm">GitHub Project</div>
            <div className="text-xs text-gray-500">Modify & Deploy</div>
          </div>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter your task command, or use voice input..."
            className="min-h-[100px] resize-none pr-14 text-sm rounded-2xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
            disabled={isExecuting}
          />
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`absolute bottom-3 right-14 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening
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
            Listening... Speak now (支持中文语音)
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

      {/* Active Agents Status */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Agent Status</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                agent.status === 'working'
                  ? 'bg-blue-50 ring-1 ring-blue-200'
                  : agent.status === 'thinking'
                  ? 'bg-amber-50 ring-1 ring-amber-200'
                  : 'bg-gray-50'
              }`}
            >
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-8 h-8 object-contain"
              />
              <div className="text-xs">
                <div className="font-medium text-gray-800">{agent.name}</div>
                <div
                  className={`text-[10px] ${
                    agent.status === 'working'
                      ? 'text-blue-600'
                      : agent.status === 'thinking'
                      ? 'text-amber-600'
                      : 'text-gray-500'
                  }`}
                >
                  {agent.status === 'idle' && 'Idle'}
                  {agent.status === 'working' && 'Working'}
                  {agent.status === 'thinking' && 'Thinking'}
                  {agent.status === 'completed' && 'Completed'}
                  {agent.status === 'error' && 'Error'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
