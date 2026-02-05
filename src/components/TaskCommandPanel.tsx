import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { Send, Sparkles, Settings, Bot, Loader2, Mic, MicOff } from 'lucide-react';
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const executeTask = useAgentStore((state) => state.executeTask);
  const setLLMConfig = useAgentStore((state) => state.setLLMConfig);
  const agents = useAgentStore((state) => state.agents);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

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

    setIsExecuting(true);
    try {
      await executeTask(command);
      setCommand('');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveConfig = () => {
    setLLMConfig({ apiUrl, apiKey, model });
  };

  const quickCommands = [
    { label: 'Design a new logo', value: 'Design a modern minimalist company logo' },
    { label: 'Build login page', value: 'Develop a user login page with form validation' },
    { label: 'Analyze sales data', value: 'Analyze last month sales data and generate a report' },
    { label: 'Create project plan', value: 'Create a two-week product development plan' },
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter your task command, e.g., Design a modern website homepage..."
            className="min-h-[120px] resize-none pr-14 text-sm rounded-2xl border-gray-200 focus:border-blue-400 focus:ring-blue-400"
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
            Listening... Speak now
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {quickCommands.map((cmd, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCommand(cmd.value)}
              className="px-4 py-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-full text-gray-600 transition-all border border-gray-200 hover:border-blue-200"
              disabled={isExecuting}
            >
              {cmd.label}
            </button>
          ))}
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
