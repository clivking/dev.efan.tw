'use client';

interface IdlePromptProps {
    onLeaveContact: () => void;
    onContinue: () => void;
}

export default function IdlePrompt({ onLeaveContact, onContinue }: IdlePromptProps) {
    return (
        <div className="idle-prompt-overlay">
            <div className="idle-prompt-card">
                <p className="idle-prompt-text">
                    還在嗎？😊<br />
                    如果想先了解價格範圍，也可以直接留資料，我們主動跟您報價。
                </p>
                <div className="idle-prompt-actions">
                    <button
                        type="button"
                        className="consultation-btn consultation-btn-primary"
                        onClick={onLeaveContact}
                    >
                        直接留資料 →
                    </button>
                    <button
                        type="button"
                        className="consultation-btn consultation-btn-secondary"
                        onClick={onContinue}
                    >
                        繼續選擇
                    </button>
                </div>
            </div>
        </div>
    );
}
