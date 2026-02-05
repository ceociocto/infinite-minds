import React from 'react';
import { useAgentStore } from '@/store/agentStore';
import { CheckCircle2, Circle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    label: 'Pending',
  },
  in_progress: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'In Progress',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Completed',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Failed',
  },
};

export const TaskList: React.FC = () => {
  const tasks = useAgentStore((state) => state.tasks);
  const agents = useAgentStore((state) => state.agents);

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || agentId;
  };

  const getAgentAvatar = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.avatar;
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-xl border border-white/50 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Task List</h3>
            <p className="text-xs text-gray-500">All tasks and their status</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {tasks.filter((t) => t.status === 'in_progress').length} Active
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            {tasks.filter((t) => t.status === 'completed').length} Done
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Clock className="w-14 h-14 mb-3 opacity-20" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs">Issue commands from the Command Center</p>
          </div>
        ) : (
          [...tasks].reverse().map((task) => {
            const status = statusConfig[task.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={task.id}
                className="p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all bg-white/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-xl ${status.bgColor} flex items-center justify-center`}
                  >
                    <StatusIcon
                      className={`w-4 h-4 ${status.color} ${
                        task.status === 'in_progress' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bgColor} ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {task.assignedTo.map((agentId) => (
                          <img
                            key={agentId}
                            src={getAgentAvatar(agentId)}
                            alt={getAgentName(agentId)}
                            className="w-6 h-6 object-contain rounded-full bg-gray-50"
                            title={getAgentName(agentId)}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] text-gray-400">
                        {format(task.createdAt, 'MMM dd, HH:mm')}
                      </span>
                    </div>

                    {task.status === 'in_progress' && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
