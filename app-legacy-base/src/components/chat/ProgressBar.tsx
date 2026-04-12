'use client';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

const DEFAULT_LABELS = ['選擇服務', '需求細節', '聯絡資料', '完成'];

export default function ProgressBar({ currentStep, totalSteps, labels = DEFAULT_LABELS }: ProgressBarProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="chat-progress-bar">
            <div className="chat-progress-track">
                <div className="chat-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="chat-progress-label">
                {labels[currentStep - 1] && (
                    <span className="chat-progress-step-name">{labels[currentStep - 1]}</span>
                )}
                <span className="chat-progress-step-count">{currentStep}/{totalSteps}</span>
            </div>
        </div>
    );
}
