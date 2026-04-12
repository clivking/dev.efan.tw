import type { ReactNode } from 'react';

type NotePreviewProps = {
    children: ReactNode;
    className?: string;
};

export default function NotePreview({ children, className = '' }: NotePreviewProps) {
    return (
        <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`.trim()}>
            {children}
        </div>
    );
}
