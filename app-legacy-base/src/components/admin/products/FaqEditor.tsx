'use client';

interface FaqItem {
    question: string;
    answer: string;
}

interface FaqEditorProps {
    value: FaqItem[];
    onChange: (faqs: FaqItem[]) => void;
}

export default function FaqEditor({ value, onChange }: FaqEditorProps) {
    const faqs = value.length > 0 ? value : [];

    const updateFaq = (index: number, field: 'question' | 'answer', val: string) => {
        const newFaqs = faqs.map((faq, i) =>
            i === index ? { ...faq, [field]: val } : faq
        );
        onChange(newFaqs);
    };

    const addFaq = () => {
        onChange([...faqs, { question: '', answer: '' }]);
    };

    const removeFaq = (index: number) => {
        onChange(faqs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <div key={index} className="p-5 bg-gray-50 rounded-2xl space-y-3 group relative">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Q: 問題</label>
                        <input
                            type="text"
                            placeholder="例：AR-721H 可以用悠遊卡嗎？"
                            className="w-full px-4 py-3 bg-white rounded-xl border-none focus:ring-2 focus:ring-efan-primary text-sm font-bold text-gray-800"
                            value={faq.question}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">A: 回答</label>
                        <textarea
                            placeholder="回答內容..."
                            className="w-full px-4 py-3 bg-white rounded-xl border-none focus:ring-2 focus:ring-efan-primary text-sm font-bold text-gray-800 min-h-[80px]"
                            value={faq.answer}
                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white border border-gray-100 text-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addFaq}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-efan-primary hover:text-efan-primary hover:bg-efan-primary/5 transition-all text-sm flex items-center justify-center gap-2"
            >
                ➕ 新增問答
            </button>
        </div>
    );
}
