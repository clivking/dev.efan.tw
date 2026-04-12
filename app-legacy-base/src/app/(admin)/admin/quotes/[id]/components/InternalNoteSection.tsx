'use client';

interface InternalNoteSectionProps {
    value: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onChange: (value: string) => void;
}

export default function InternalNoteSection({ value, isOpen, onToggle, onChange }: InternalNoteSectionProps) {
    const hasValue = Boolean(value);

    return (
        <div className="border-b border-gray-100 bg-amber-50/10 p-4 md:p-8">
            <div className="max-w-4xl space-y-4">
                <div className="group flex cursor-pointer items-center justify-between" onClick={onToggle}>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors group-hover:text-amber-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${hasValue ? 'bg-amber-500' : 'bg-gray-300'}`} />
                        內部備註（業務備忘，僅後台可見）
                        {hasValue && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-600">有資料</span>}
                    </label>
                    <button type="button" className="text-xs font-bold text-gray-400">
                        {isOpen || hasValue ? '收起 ▲' : '展開編輯 ▼'}
                    </button>
                </div>
                {(isOpen || hasValue) && (
                    <textarea
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[100px] w-full animate-in rounded-2xl border border-amber-100 bg-amber-50/50 px-5 py-4 text-sm font-medium leading-relaxed shadow-inner duration-200 slide-in-from-top-2 focus:ring-2 focus:ring-amber-400"
                        placeholder="只有員工能看到的私人記錄..."
                    />
                )}
            </div>
        </div>
    );
}
