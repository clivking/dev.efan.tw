'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface VideoUrlInputProps {
    value: string;
    onChange: (url: string) => void;
}

function getYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return match ? match[1] : null;
}

export default function VideoUrlInput({ value, onChange }: VideoUrlInputProps) {
    const videoId = useMemo(() => getYouTubeId(value || ''), [value]);

    return (
        <div className="space-y-4">
            <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-efan-primary focus:bg-white transition-all font-bold text-gray-800 text-sm"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="text-xs text-gray-400 font-bold px-2">
                支援格式：youtube.com/watch?v=... · youtu.be/... · youtube.com/shorts/...
            </p>
            {videoId && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                    <Image
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                        alt="YouTube 預覽"
                        width={480}
                        height={270}
                        sizes="100vw"
                        className="w-full aspect-video object-cover"
                    />
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 font-bold">
                        ✅ 已偵測影片 ID：{videoId}
                    </div>
                </div>
            )}
            {value && !videoId && (
                <div className="px-4 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                    ⚠️ 無法解析 YouTube 影片 ID，請確認網址格式
                </div>
            )}
        </div>
    );
}
