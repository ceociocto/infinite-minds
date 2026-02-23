import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import styles from '../../app/studio/studio.module.css';

export interface AgentVisualHandle {
    showTalk: (text: string) => void;
    moveTo: (x: number, y: number, onCreateSteam?: (x: number, y: number) => void) => Promise<void>;
    shake: () => void;
}

interface AgentVisualProps {
    id: string;
    role: string;
    imageUrl: string;
    initialX: number;
    initialY: number;
    status: 'idle' | 'working' | 'thinking' | 'completed' | 'error';
    progress: number;
}

export const AgentVisual = forwardRef<AgentVisualHandle, AgentVisualProps>(
    ({ id, role, imageUrl, initialX, initialY, status, progress }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const visualRef = useRef<HTMLDivElement>(null);
        const bubbleRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            showTalk: (text: string) => {
                if (!bubbleRef.current) return;
                bubbleRef.current.innerText = text;
                gsap.to(bubbleRef.current, { opacity: 1, y: -20, duration: 0.5 });
                setTimeout(() => {
                    if (bubbleRef.current) {
                        gsap.to(bubbleRef.current, { opacity: 0, y: 0, duration: 0.5 });
                    }
                }, 3000);
            },
            moveTo: (x: number, y: number, onCreateSteam?: (x: number, y: number) => void) => {
                return new Promise((resolve) => {
                    if (!containerRef.current || !visualRef.current) {
                        resolve();
                        return;
                    }

                    // Walking jump simulation
                    gsap.to(visualRef.current, {
                        y: -30,
                        repeat: 5,
                        yoyo: true,
                        duration: 0.2
                    });

                    gsap.to(containerRef.current, {
                        left: x,
                        top: y,
                        duration: 2,
                        ease: 'power1.inOut',
                        onUpdate: () => {
                            if (onCreateSteam && Math.random() > 0.9) {
                                onCreateSteam(
                                    parseFloat(containerRef.current!.style.left),
                                    parseFloat(containerRef.current!.style.top)
                                );
                            }
                        },
                        onComplete: () => {
                            if (visualRef.current) {
                                gsap.to(visualRef.current, { y: 0, duration: 0.3 });
                            }
                            resolve();
                        }
                    });
                });
            },
            shake: () => {
                if (!visualRef.current) return;
                gsap.to(visualRef.current, { x: 5, repeat: 10, yoyo: true, duration: 0.05 });
            }
        }));

        useEffect(() => {
            // Breathing animation
            if (visualRef.current) {
                gsap.to(visualRef.current, {
                    y: -10,
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                    // Use id string hash or math random to vary starting point
                    delay: Math.random() * 0.5
                });
            }
        }, []);

        return (
            <div
                ref={containerRef}
                id={id}
                className={styles.agentContainer}
                style={{ top: initialY, left: initialX }}
            >
                <div ref={bubbleRef} className={styles.scrollBubble}></div>
                <div
                    ref={visualRef}
                    style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', transform: 'rotateZ(45deg) rotateX(-55deg)' }}
                >
                    <img
                        src={imageUrl}
                        alt={role}
                        style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            filter: status === 'working' ? 'brightness(1.2) drop-shadow(0 0 15px rgba(212, 175, 55, 0.8))' : 'brightness(0.8) drop-shadow(0 15px 10px rgba(0,0,0,0.5))',
                            transition: 'filter 0.3s'
                        }}
                    />

                    {/* Status Ring / Glow */}
                    {(status === 'working' || status === 'thinking') && (
                        <div style={{
                            position: 'absolute',
                            inset: -8,
                            borderRadius: '50%',
                            border: '2px solid rgba(99, 102, 241, 0.5)',
                            animation: status === 'thinking' ? 'spin 4s linear infinite' : 'pulse 2s infinite',
                            pointerEvents: 'none',
                        }} />
                    )}

                    <div style={{
                        position: 'absolute',
                        bottom: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#b87333',
                        color: 'white',
                        padding: '2px 8px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Grenze Gotisch', serif"
                    }}>
                        {role} {progress > 0 && status === 'working' ? `(${progress}%)` : ''}
                    </div>
                </div>
            </div>
        );
    }
);
AgentVisual.displayName = 'AgentVisual';
