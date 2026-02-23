'use client';

import React, { useMemo } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { Cpu, Server, Activity, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { AGENT_ROLES, type Agent } from '@/types';

export const AgentScene: React.FC = () => {
    const agents = useAgentStore((state) => state.agents);
    const agentProgress = useAgentStore((state) => state.agentProgress);
    const isExecuting = useAgentStore((state) => state.isExecuting);

    const activeCount = useMemo(() => agents.filter(a => a.status === 'working' || a.status === 'thinking').length, [agents]);

    // Position calculation helpers for semi-circle
    const getAgentPosition = (index: number, total: number) => {
        // Distribute along an arc
        const spread = 120; // total angle spread
        const startAngle = 180 - (180 - spread) / 2;
        const angleStep = spread / Math.max(1, total - 1);
        const currentAngle = startAngle - index * angleStep;
        const radian = (currentAngle * Math.PI) / 180;

        // Ellipse radius
        const rx = 35; // % width
        const ry = 15; // % height

        const x = 50 + rx * Math.cos(radian);
        const y = 85 - ry * Math.sin(radian);

        return { x, y };
    };

    return (
        <div className="relative w-full overflow-hidden rounded-3xl border border-indigo-500/30 bg-gray-900 shadow-2xl h-[280px] xl:h-[320px] mb-6 select-none group">
            {/* Background elements */}
            <div className="absolute inset-0 cyber-grid opacity-20 transition-opacity duration-1000" style={{ opacity: isExecuting ? 0.4 : 0.15 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/90 to-transparent" />

            {/* Central Data Core */}
            <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-2 
                    ${isExecuting ? 'border-indigo-400 rotate-animation shadow-[0_0_40px_rgba(99,102,241,0.6)]' : 'border-gray-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]'}`}>
                    <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/50 reverse-rotate-animation" />
                    <Database className={`w-8 h-8 ${isExecuting ? 'text-indigo-300 animate-pulse' : 'text-gray-600'}`} />

                    {/* Activity waves emitted from core when active */}
                    {isExecuting && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-indigo-400/50 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-10" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                        </>
                    )}
                </div>
                <div className="mt-4 text-center">
                    <div className="text-xs font-bold text-indigo-300 tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-sm">
                        <Server className="w-3 h-3" />
                        Main Nexus
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                        Capacity: {activeCount}/{agents.length} Threads
                    </div>
                </div>
            </div>

            {/* Render Agents in Semi-Circle */}
            {agents.map((agent, index) => {
                const pos = getAgentPosition(index, agents.length);
                const status = isExecuting ? agent.status : 'idle';
                const progress = isExecuting ? (agentProgress[agent.id] || 0) : 0;

                const isWorking = status === 'working';
                const isThinking = status === 'thinking';
                const isCompleted = status === 'completed';
                const isError = status === 'error';

                const roleConfig = AGENT_ROLES[agent.role];
                const baseColor = roleConfig?.color || '#6366f1';

                return (
                    <div
                        key={agent.id}
                        className="absolute flex flex-col items-center transition-all duration-700 ease-out"
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10 + Math.round(pos.y)
                        }}
                    >
                        {/* Data Connection Beam to Core */}
                        {isWorking && (
                            <svg className="absolute w-[200px] h-[200px] pointer-events-none data-beam-container" style={{
                                top: '50%', left: '50%',
                                zIndex: -1,
                                transform: `translate(-50%, -50%) rotate(${Math.atan2(40 - pos.y, 50 - pos.x) * (180 / Math.PI) - 90}deg)`
                            }}>
                                <line x1="100" y1="100" x2="100" y2="0" stroke="url(#beam-gradient)" strokeWidth="2" className="animate-beam-dash" strokeDasharray="5,5" />
                                <defs>
                                    <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={baseColor} stopOpacity="0.8" />
                                        <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        )}

                        {/* Status Indicator */}
                        <div className="absolute -top-6 flex justify-center w-full">
                            {isThinking && <Activity className="w-4 h-4 text-amber-400 animate-spin" />}
                            {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />}
                            {isError && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                            {isWorking && progress > 0 && (
                                <div className="text-[9px] font-bold text-white bg-gray-900/80 px-1.5 py-0.5 rounded border" style={{ borderColor: baseColor }}>
                                    {progress}%
                                </div>
                            )}
                        </div>

                        {/* Agent Avatar / Robot Frame */}
                        <div
                            className={`relative w-12 h-12 rounded-xl border flex items-center justify-center bg-gray-900/80 backdrop-blur-sm transition-all duration-300
                                ${isWorking ? 'shadow-lg animate-agent-work' : ''}
                                ${isThinking ? 'animate-agent-think' : ''}
                                ${isCompleted ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
                                ${isError ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake' : ''}
                                ${!isWorking && !isThinking && !isCompleted && !isError ? 'border-gray-700/50' : ''}
                            `}
                            style={{
                                borderColor: isWorking || isThinking ? baseColor : undefined,
                                boxShadow: isWorking ? `0 0 20px ${baseColor}40` : undefined
                            }}
                        >
                            {/* Inner glow pulse when active */}
                            {(isWorking || isThinking) && (
                                <div className="absolute inset-0 rounded-xl opacity-20 animate-pulse" style={{ backgroundColor: baseColor }} />
                            )}

                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                className={`w-8 h-8 object-contain z-10 ${isWorking ? 'brightness-125' : 'brightness-75 grayscale-[20%]'}`}
                            />
                        </div>

                        {/* Console Label */}
                        <div className="mt-2 bg-gray-950/80 border border-gray-800 rounded px-2 py-0.5 whitespace-nowrap backdrop-blur-md">
                            <span className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${status !== 'idle' ? 'animate-pulse' : ''}`}
                                    style={{ backgroundColor: status === 'idle' ? '#4b5563' : baseColor }}
                                />
                                {agent.roleName}
                            </span>
                        </div>

                        {/* Progress Bar Track (Floor level) */}
                        {isWorking && (
                            <div className="mt-1 w-14 h-1 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                <div
                                    className="h-full transition-all duration-300 w-full"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundColor: baseColor,
                                        boxShadow: `0 0 5px ${baseColor}`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* CSS Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .cyber-grid {
                    background-image: 
                        linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px);
                    background-size: 30px 30px;
                    transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
                }
                .rotate-animation {
                    animation: slow-spin 10s linear infinite;
                }
                .reverse-rotate-animation {
                    animation: slow-spin-reverse 15s linear infinite;
                }
                @keyframes slow-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slow-spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-agent-work {
                    animation: shake-light 0.5s ease-in-out infinite alternate;
                }
                .animate-agent-think {
                    animation: float-bob 2s ease-in-out infinite;
                }
                .animate-shake {
                    animation: shake-error 0.3s ease-in-out infinite;
                }
                .animate-beam-dash {
                    animation: dash-flow 1s linear infinite;
                }
                @keyframes shake-light {
                    0% { transform: translateY(0px) rotate(0deg); }
                    100% { transform: translateY(-2px) rotate(1deg); }
                }
                @keyframes float-bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes shake-error {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    75% { transform: translateX(2px); }
                }
                @keyframes dash-flow {
                    to { stroke-dashoffset: -10; }
                }
            `}} />
        </div>
    );
};
