'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import PageBanner from '@/components/common/PageBanner';

interface Download {
    id: string;
    title: string;
    description: string | null;
    externalUrl: string | null;
    filePath: string | null;
    version: string | null;
    categoryTag: string | null;
    fileSize: number | null;
    manualPath: string | null;
    imagePath: string | null;
}

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function SupportDownloadsPage() {
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetch('/api/portal/downloads')
            .then(res => res.json())
            .then(data => setDownloads(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const categories = [...new Set(downloads.map(d => d.categoryTag).filter(Boolean))] as string[];
    const filteredDownloads = filter ? downloads.filter(d => d.categoryTag === filter) : downloads;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-efan-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            {/* Blue Banner */}
            <PageBanner title="軟體下載" subtitle="門禁、監視系統相關軟體與驅動程式" />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-10 w-full">
                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="flex gap-2 mb-6 flex-wrap">
                        <button
                            onClick={() => setFilter('')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!filter ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            全部 ({downloads.length})
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {filteredDownloads.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="font-medium">目前沒有可下載的軟體</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredDownloads.map(d => (
                            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group">
                                <div className="relative w-14 h-14 bg-efan-primary/5 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-efan-primary/10 transition-colors overflow-hidden">
                                    {d.imagePath ? (
                                        <Image src={`/api/portal/downloads/image?path=${encodeURIComponent(d.imagePath)}`} alt={d.title} fill sizes="56px" unoptimized className="w-full h-full object-cover" />
                                    ) : (
                                        '📦'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800">{d.title}</h3>
                                    {d.description && <p className="text-sm text-gray-500 mt-0.5">{d.description}</p>}
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                        {d.version && <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{d.version}</span>}
                                        {d.categoryTag && <span className="bg-gray-100 px-2 py-0.5 rounded">{d.categoryTag}</span>}
                                        {d.fileSize && <span>{formatFileSize(d.fileSize)}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <a
                                        href={d.filePath ? `/api/portal/downloads/${d.id}/file` : (d.externalUrl || '#')}
                                        target={d.externalUrl && !d.filePath ? '_blank' : undefined}
                                        rel={d.externalUrl && !d.filePath ? 'noopener noreferrer' : undefined}
                                        className="bg-efan-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-efan-primary/90 transition-all shadow-lg shadow-efan-primary/20"
                                    >
                                        ⬇️ 下載
                                    </a>
                                    {d.manualPath && (
                                        <a
                                            href={`/api/portal/downloads/${d.id}/manual`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                                        >
                                            📄 說明書
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
