'use client';

import React, { useEffect } from 'react';
import { SteampunkScene } from '../../components/studio/SteampunkScene';
import { TaskCommandPanel } from '@/components/TaskCommandPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { getAgentSwarm } from '@/lib/agents/swarm';
import { useAgentStore } from '@/store/agentStore';

export default function StudioPage() {
    const checkServerConfig = useAgentStore((state) => state.checkServerConfig);

    useEffect(() => {
        checkServerConfig();

        // Handle page refresh/close
        const handleBeforeUnload = () => {
            const swarm = getAgentSwarm();
            swarm.cancelMonitoring();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup: Cancel any ongoing monitoring when component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            const swarm = getAgentSwarm();
            swarm.cancelMonitoring();
        };
    }, [checkServerConfig]);

    return (
        <div style={{ background: '#0a0806', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-sm border-b border-indigo-500/30">
                <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-400 tracking-wider" style={{ textShadow: '0 0 10px rgba(99,102,241,0.5)' }}>STUDIO COMMAND</h1>
                    {/* Add back button or other header elements if needed */}
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 max-w-[1600px] mx-auto w-full h-[calc(100vh-70px)]">
                {/* Left Side - Controls & Results */}
                <div className="w-full lg:w-[45%] flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex-shrink-0">
                        <TaskCommandPanel />
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <ResultsPanel />
                    </div>
                </div>

                {/* Right Side - Visual Scene */}
                <div className="w-full lg:w-[55%] h-full rounded-2xl overflow-hidden border border-indigo-500/30 relative">
                    <SteampunkScene />
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.5);
                }
            `}} />
        </div>
    );
}
