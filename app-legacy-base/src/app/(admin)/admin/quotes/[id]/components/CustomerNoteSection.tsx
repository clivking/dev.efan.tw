'use client';

interface CustomerNoteSectionProps {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}

export default function CustomerNoteSection({ value, disabled, onChange }: CustomerNoteSectionProps) {
    return (
        <div className="border-b border-gray-100 p-4 md:p-8">
            <div className="max-w-4xl space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    客戶備註
                </label>
                <textarea
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full min-h-[120px] rounded-2xl border-none bg-gray-50 px-5 py-4 text-sm font-medium leading-relaxed shadow-inner focus:ring-2 focus:ring-efan-primary disabled:opacity-50"
                    placeholder="這裡會顯示在給客戶的 PDF 或對外文件中。"
                />
            </div>
        </div>
    );
}
