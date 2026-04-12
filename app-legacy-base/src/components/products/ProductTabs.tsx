'use client';

import { useEffect, useState } from 'react';

interface TabContent {
    key: string;
    label: string;
    content: React.ReactNode;
}

interface ProductTabsProps {
    tabs: TabContent[];
}

export default function ProductTabs({ tabs }: ProductTabsProps) {
    const tabOrder: Record<string, number> = {
        intro: 1,
        usage: 2,
        specs: 3,
        faq: 4,
        video: 5,
        docs: 6,
    };

    const orderedTabs = [...tabs].sort((a, b) => (tabOrder[a.key] ?? 99) - (tabOrder[b.key] ?? 99));
    const [activeTab, setActiveTab] = useState(orderedTabs[0]?.key || '');
    const [isMobile, setIsMobile] = useState(false);
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(orderedTabs.map((tab) => tab.key)));

    useEffect(() => {
        const checkViewport = () => setIsMobile(window.innerWidth < 768);
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    useEffect(() => {
        if (!orderedTabs.find((tab) => tab.key === activeTab)) {
            setActiveTab(orderedTabs[0]?.key || '');
        }
    }, [activeTab, orderedTabs]);

    if (orderedTabs.length === 0) return null;
    if (orderedTabs.length === 1) return <div>{orderedTabs[0].content}</div>;

    const toggleAccordion = (key: string) => {
        setOpenAccordions((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (isMobile) {
        return (
            <div className="space-y-3">
                {orderedTabs.map((tab) => (
                    <div key={tab.key} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <button
                            onClick={() => toggleAccordion(tab.key)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left"
                        >
                            <span className="text-sm font-black text-gray-800">{tab.label}</span>
                            <span className={`text-gray-400 transition-transform ${openAccordions.has(tab.key) ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>
                        {openAccordions.has(tab.key) ? (
                            <div className="border-t border-gray-100 px-5 pb-5 pt-4 animate-in slide-in-from-top-2 duration-300">
                                {tab.content}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-20 z-10 -mx-2 overflow-x-auto px-2 pb-2">
                <div className="inline-flex min-w-full gap-2 rounded-[24px] border border-gray-100 bg-white/95 p-2 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.4)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
                    {orderedTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`rounded-xl px-5 py-3 text-sm font-black whitespace-nowrap transition-all ${
                                activeTab === tab.key
                                    ? 'bg-efan-primary text-white shadow-lg shadow-efan-primary/20'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="rounded-[32px] border border-gray-100 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-6 shadow-[0_24px_60px_-52px_rgba(15,23,42,0.45)] sm:p-8">
                {orderedTabs.find((tab) => tab.key === activeTab)?.content}
            </div>
        </div>
    );
}
