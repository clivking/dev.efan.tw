'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import PageBanner from '@/components/common/PageBanner';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/structured-data';

interface Video {
    id: string;
    title: string;
    description: string | null;
    categoryTag: string | null;
    thumbnailUrl: string | null;
}

interface UserInfo {
    displayName: string;
    companyName: string;
}

export default function PortalPage() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const meRes = await fetch('/api/portal/auth/me');
                if (!meRes.ok) {
                    router.push('/portal/login');
                    return;
                }
                const meData = await meRes.json();
                setUser(meData.user);

                const videosRes = await fetch('/api/portal/videos');
                if (videosRes.ok) {
                    setVideos(await videosRes.json());
                }
            } catch {
                router.push('/portal/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/portal/auth/logout', { method: 'POST' });
        router.push('/portal/login');
    };

    const categories = [...new Set(videos.map(v => v.categoryTag).filter(Boolean))] as string[];
    const filteredVideos = filter ? videos.filter(v => v.categoryTag === filter) : videos;

    const breadcrumbs = withHomeBreadcrumb('教學專區');
    const breadcrumbSchema = buildBreadcrumbSchema(
        toBreadcrumbSchemaItems(
            breadcrumbs,
            typeof window !== 'undefined' ? window.location.origin : '',
            '/portal',
        ),
    );

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-efan-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            <JsonLdScript data={breadcrumbSchema} />
            {/* Blue Banner */}
            <div className="relative">
                <PageBanner
                    title="獨家教學影片"
                    subtitle={`歡迎，${user?.displayName || ''}${user?.companyName ? `（${user.companyName}）` : ''}`}
                    breadcrumbs={breadcrumbs}
                />
                <div className="absolute top-6 right-8 z-10">
                    <button
                        onClick={handleLogout}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                        登出
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-10 w-full">
                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="flex gap-2 mb-8 flex-wrap">
                        <button
                            onClick={() => setFilter('')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!filter ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            全部 ({videos.length})
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-efan-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {cat} ({videos.filter(v => v.categoryTag === cat).length})
                            </button>
                        ))}
                    </div>
                )}

                {/* Video Grid */}
                {filteredVideos.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="font-medium">目前沒有教學影片</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map(video => (
                            <Link
                                key={video.id}
                                href={`/portal/videos/${video.id}`}
                                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="relative aspect-video bg-gray-100">
                                    {video.thumbnailUrl ? (
                                        <Image src={video.thumbnailUrl} alt={video.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🎬</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-5xl drop-shadow-lg">▶</div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 group-hover:text-efan-primary transition-colors">{video.title}</h3>
                                    {video.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                                    )}
                                    {video.categoryTag && (
                                        <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{video.categoryTag}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
