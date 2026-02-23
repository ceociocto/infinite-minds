import React from 'react';
import styles from '../../app/studio/studio.module.css';

interface RetroPanelProps {
    onTaskDev: () => void;
    onTaskAnalysis: () => void;
    isBusy: boolean;
}

export const RetroPanel: React.FC<RetroPanelProps> = ({ onTaskDev, onTaskAnalysis, isBusy }) => {
    return (
        <div className={styles.retroPanel}>
            <button
                className={styles.steamBtn}
                onClick={onTaskDev}
                disabled={isBusy}
                style={{ opacity: isBusy ? 0.5 : 1, cursor: isBusy ? 'not-allowed' : 'pointer' }}
            >
                启动代码开发任务
            </button>
            <button
                className={styles.steamBtn}
                onClick={onTaskAnalysis}
                disabled={isBusy}
                style={{ opacity: isBusy ? 0.5 : 1, cursor: isBusy ? 'not-allowed' : 'pointer' }}
            >
                启动商业情报分析
            </button>
        </div>
    );
};
