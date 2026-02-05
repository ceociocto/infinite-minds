import React, { useEffect, useState } from 'react';
import { useAgentStore } from '@/store/agentStore';
import {
  TrendingUp,
  Zap,
  Users,
  CheckCircle,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const StatsPanel: React.FC = () => {
  const agents = useAgentStore((state) => state.agents);
  const tasks = useAgentStore((state) => state.tasks);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalTasksCompleted = agents.reduce(
    (sum, agent) => sum + agent.stats.tasksCompleted,
    0
  );
  const avgEfficiency = Math.round(
    agents.reduce((sum, agent) => sum + agent.stats.efficiency, 0) /
      agents.length
  );
  const avgCollaboration = Math.round(
    agents.reduce((sum, agent) => sum + agent.stats.collaboration, 0) /
      agents.length
  );
  const activeAgents = agents.filter((a) => a.status === 'working').length;

  const stats = [
    {
      label: 'Tasks Completed',
      value: totalTasksCompleted,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Avg Efficiency',
      value: mounted ? `${avgEfficiency}%` : '--',
      icon: Zap,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Collaboration',
      value: mounted ? `${avgCollaboration}%` : '--',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Agents',
      value: activeAgents,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  // Chart data
    const efficiencyData = agents.map((agent) => ({
    name: agent.name,
    efficiency: agent.stats.efficiency,
    collaboration: agent.stats.collaboration,
    color: agent.role === 'pm' ? '#3b82f6' :
           agent.role === 'developer' ? '#1e293b' :
           agent.role === 'designer' ? '#ec4899' :
           agent.role === 'analyst' ? '#10b981' :
           agent.role === 'researcher' ? '#8b5cf6' :
           agent.role === 'writer' ? '#f59e0b' : '#06b6d4',
  }));

  const taskDistribution = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#9ca3af' },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Team Analytics</h3>
            <p className="text-xs text-gray-500">Real-time performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">+12% this week</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl p-4 transition-all hover:shadow-lg border border-gray-100"
            >
              <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Efficiency Chart */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            Agent Efficiency Comparison
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} width={70} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value}%`, 'Efficiency']}
                />
                <Bar dataKey="efficiency" radius={[0, 6, 6, 0]} barSize={20}>
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            Task Distribution
          </h4>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {taskDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Bars */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Individual Performance
        </h4>
        <div className="space-y-4">
          {mounted ? (
            agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-4">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-10 h-10 object-contain"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{agent.name}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {agent.stats.efficiency}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${agent.stats.efficiency}%`,
                        background: agent.role === 'pm'
                          ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                          : agent.role === 'developer'
                          ? 'linear-gradient(90deg, #1e293b, #475569)'
                          : agent.role === 'designer'
                          ? 'linear-gradient(90deg, #ec4899, #f472b6)'
                          : agent.role === 'analyst'
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : agent.role === 'researcher'
                          ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                          : agent.role === 'writer'
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};
