'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface VideoDetail {
    id: string;
    title: string;
    description: string | null;
    youtubeUrl: string;
    categoryTag: string | null;
}

function extractYoutubeId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return m ? m[1] : null;
}

export default function PortalVideoPage() {
    const { id } = useParams();
    const router = useRouter();
    const [video, setVideo] = useState<VideoDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await fetch(`/api/portal/videos/${id}`);
                if (res.status === 401) {
                    router.push('/portal/login');
                    return;
                }
                if (!res.ok) {
                    setError('影片不存在');
                    return;
                }
                setVideo(await res.json());
            } catch {
                setError('載入失敗');
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <p className="text-gray-600 font-medium">{error || '影片不存在'}</p>
                    <Link href="/portal" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
                        ← 回到影片列表
                    </Link>
                </div>
            </div>
        );
    }

    const ytId = extractYoutubeId(video.youtubeUrl);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <Link href="/portal" className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 inline-block">
                ← 回到影片列表
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
                {/* Video Player */}
                <div className="aspect-video bg-black">
                    {ytId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=zh-TW`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                            <p>無法載入影片</p>
                        </div>
                    )}
                </div>

                {/* Video Info */}
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-800">{video.title}</h1>
                    {video.categoryTag && (
                        <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                            {video.categoryTag}
                        </span>
                    )}
                    {video.description && (
                        <p className="text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">{video.description}</p>
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-xl text-sm text-yellow-700">
                ⚠️ 此影片為一帆安全成交客戶專屬內容，請勿分享或外傳。
            </div>
        </div>
    );
}
