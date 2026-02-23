import gsap from 'gsap';
import styles from '../../app/studio/studio.module.css';

export function createSteam(container: HTMLElement | null, x: number, y: number) {
    if (!container) return;

    for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        // Using string class assigned from styles
        p.className = styles.particle;
        container.appendChild(p);

        const size = Math.random() * 30 + 10;
        gsap.set(p, { x: x + 50, y: y + 80, width: size, height: size, opacity: 0.6 });

        gsap.to(p, {
            y: y - 100,
            x: x + (Math.random() - 0.5) * 100,
            opacity: 0,
            scale: 3,
            duration: 2 + Math.random(),
            onComplete: () => {
                if (p.parentNode === container) {
                    container.removeChild(p);
                }
            }
        });
    }
}

export function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}
