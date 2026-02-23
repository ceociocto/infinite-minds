import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import styles from '../../app/studio/studio.module.css';
import { AgentVisual, AgentVisualHandle } from './AgentVisual';
import { createSteam, delay } from './ParticleEngine';
import { useAgentStore } from '@/store/agentStore';
import { AGENT_ROLES } from '@/types';

export interface SteampunkSceneHandle {
    // Left for backward compatibility if needed, but not used anymore
    runDevTask: () => Promise<void>;
    runAnalysisTask: () => Promise<void>;
}

export const SteampunkScene = forwardRef<SteampunkSceneHandle>((props, ref) => {
    const worldRef = useRef<HTMLDivElement>(null);
    const agentRefs = useRef<Record<string, AgentVisualHandle | null>>({});

    const agents = useAgentStore((state) => state.agents);
    const messages = useAgentStore((state) => state.messages);
    const agentProgress = useAgentStore((state) => state.agentProgress);
    const isExecuting = useAgentStore((state) => state.isExecuting);

    // Map positions based on index roughly
    const STATIONS = [
        { x: 200, y: 250 }, // ARCHIVE
        { x: 650, y: 250 }, // FORGE
        { x: 450, y: 550 }, // COMMAND
        { x: 300, y: 400 },
        { x: 600, y: 400 },
        { x: 450, y: 350 },
    ];

    // Initial starting positions (idle)
    const IDLE_POSITIONS = [
        { x: 250, y: 650 },
        { x: 350, y: 650 },
        { x: 450, y: 650 },
        { x: 550, y: 650 },
        { x: 650, y: 650 },
        { x: 400, y: 750 },
    ];

    const handleCreateSteam = (x: number, y: number) => {
        createSteam(worldRef.current, x, y);
    };

    useImperativeHandle(ref, () => ({
        runDevTask: async () => { },
        runAnalysisTask: async () => { },
    }));

    // Listen to new messages to show chat bubbles
    useEffect(() => {
        if (messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.from !== 'user' && lastMsg.from !== 'system' && lastMsg.type !== 'result') {
            const agentVisual = agentRefs.current[lastMsg.from];
            if (agentVisual) {
                // Shorten displayed text
                let text = lastMsg.content;
                if (text.length > 50) text = text.substring(0, 47) + '...';
                agentVisual.showTalk(text);
            }
        }
    }, [messages]);

    // Animate agents when they start working
    useEffect(() => {
        agents.forEach((agent, i) => {
            const visual = agentRefs.current[agent.id];
            if (visual) {
                if (agent.status === 'working') {
                    // Pick a station
                    const station = STATIONS[i % STATIONS.length];
                    visual.moveTo(station.x, station.y, handleCreateSteam);
                } else if (agent.status === 'idle' || agent.status === 'completed') {
                    // Move back to initial / idle position
                    const idlePos = IDLE_POSITIONS[i % IDLE_POSITIONS.length];
                    visual.moveTo(idlePos.x, idlePos.y, undefined);
                }

                if (agent.status === 'error') {
                    visual.shake();
                }
            }
        });
    }, [agents.map(a => a.status).join(',')]); // Only trigger when statuses change

    return (
        <div className={styles.viewport}>
            <div className={styles.world} ref={worldRef}>
                {/* Buildings / Stations */}
                <div className={styles.station} style={{ width: 200, height: 200, top: 50, left: 50 }}>
                    DATABASE ARCHIVE
                </div>
                <div className={styles.station} style={{ width: 200, height: 200, top: 50, right: 50 }}>
                    DEVELOPMENT FORGE
                </div>
                <div className={styles.station} style={{ width: 300, height: 200, bottom: 50, left: '50%', transform: 'translateX(-50%)' }}>
                    COMMAND CENTER
                </div>

                {/* Dynamic Agents mapped from store */}
                {agents.map((agent, i) => {
                    const progress = agentProgress[agent.id] || 0;
                    const idlePos = IDLE_POSITIONS[i % IDLE_POSITIONS.length];
                    return (
                        <AgentVisual
                            key={agent.id}
                            ref={(el) => {
                                agentRefs.current[agent.id] = el;
                            }}
                            id={agent.id}
                            role={agent.roleName}
                            imageUrl={agent.avatar}
                            initialX={idlePos.x}
                            initialY={idlePos.y}
                            status={isExecuting ? agent.status : 'idle'}
                            progress={progress}
                        />
                    );
                })}
            </div>
        </div>
    );
});
SteampunkScene.displayName = 'SteampunkScene';
