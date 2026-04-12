'use client';

interface CompletionInfoSectionProps {
    completedAt: string | null;
    note: string | null;
    isOpen: boolean;
    onToggle: () => void;
    onChangeCompletedAt: (value: string | null) => void;
    onChangeNote: (value: string) => void;
}

export default function CompletionInfoSection({
    completedAt,
    note,
    isOpen,
    onToggle,
    onChangeCompletedAt,
    onChangeNote,
}: CompletionInfoSectionProps) {
    const hasValue = Boolean(note || completedAt);

    return (
        <div className="border-b border-gray-100 bg-indigo-50/10 p-4 md:p-8">
            <div className="max-w-4xl space-y-4">
                <div className="group flex cursor-pointer items-center justify-between" onClick={onToggle}>
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors group-hover:text-indigo-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${hasValue ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        完工資訊（僅後台可見）
                        {hasValue && <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-600">有資料</span>}
                    </label>
                    <button type="button" className="text-xs font-bold text-gray-400" data-testid="completion-note-toggle">
                        {isOpen || hasValue ? '收起 ▲' : '展開編輯 ▼'}
                    </button>
                </div>
                {(isOpen || hasValue) && (
                    <div className="animate-in space-y-4 duration-200 slide-in-from-top-2">
                        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-indigo-100/50 bg-white/50 p-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">施工日期</label>
                                <input
                                    type="date"
                                    value={completedAt ? completedAt.split('T')[0] : ''}
                                    onChange={(e) => onChangeCompletedAt(e.target.value || null)}
                                    max="9999-12-31"
                                    className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                        </div>
                        <textarea
                            data-testid="completion-note-textarea"
                            value={note ?? ''}
                            onChange={(e) => onChangeNote(e.target.value)}
                            className="min-h-[120px] w-full rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4 text-sm font-medium leading-relaxed shadow-inner focus:ring-2 focus:ring-indigo-400"
                            placeholder="記錄設備 IP、帳號密碼、弱電箱位置等技術細節..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
