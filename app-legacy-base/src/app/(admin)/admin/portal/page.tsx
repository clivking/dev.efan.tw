'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Video {
    id: string;
    title: string;
    description: string | null;
    youtubeUrl: string;
    categoryTag: string | null;
    thumbnailUrl: string | null;
    sortOrder: number;
    isPublished: boolean;
}

interface Download {
    id: string;
    title: string;
    description: string | null;
    filePath: string | null;
    externalUrl: string | null;
    version: string | null;
    categoryTag: string | null;
    fileSize: number | null;
    manualPath: string | null;
    imagePath: string | null;
    sortOrder: number;
    isPublished: boolean;
}

const CATEGORY_OPTIONS = ['門禁', '監視', '電話', '其他'];

function extractYoutubeId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return m ? m[1] : null;
}

export default function PortalAdminPage() {
    const [activeTab, setActiveTab] = useState<'videos' | 'downloads'>('videos');
    const [videos, setVideos] = useState<Video[]>([]);
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
    const [editingDownload, setEditingDownload] = useState<Partial<Download> | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [uploadingManual, setUploadingManual] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/portal/downloads/upload', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setEditingDownload(prev => prev ? {
                    ...prev,
                    filePath: data.filePath,
                    fileSize: data.fileSize,
                } : prev);
                setUploadedFileName(data.originalName);
            } else {
                const err = await res.json();
                alert(err.error || '上傳失敗');
            }
        } catch {
            alert('上傳失敗');
        } finally {
            setUploading(false);
        }
    };

    const handleManualUpload = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('只能上傳 PDF 檔案');
            return;
        }
        setUploadingManual(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/portal/downloads/upload', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setEditingDownload(prev => prev ? { ...prev, manualPath: data.filePath } : prev);
            } else {
                const err = await res.json();
                alert(err.error || '上傳失敗');
            }
        } catch {
            alert('上傳失敗');
        } finally {
            setUploadingManual(false);
        }
    };

    const triggerManualPicker = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) handleManualUpload(f);
        };
        input.click();
    };

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('只能上傳圖片檔案');
            return;
        }
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/portal/downloads/upload', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setEditingDownload(prev => prev ? { ...prev, imagePath: data.filePath } : prev);
            } else {
                const err = await res.json();
                alert(err.error || '上傳失敗');
            }
        } catch {
            alert('上傳失敗');
        } finally {
            setUploadingImage(false);
        }
    };

    const triggerImagePicker = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) handleImageUpload(f);
        };
        input.click();
    };

    const fetchVideos = useCallback(async () => {
        const res = await fetch('/api/admin/portal/videos');
        if (res.ok) setVideos(await res.json());
    }, []);

    const fetchDownloads = useCallback(async () => {
        const res = await fetch('/api/admin/portal/downloads');
        if (res.ok) setDownloads(await res.json());
    }, []);

    useEffect(() => {
        Promise.all([fetchVideos(), fetchDownloads()]).finally(() => setLoading(false));
    }, [fetchVideos, fetchDownloads]);

    // Video CRUD
    const saveVideo = async () => {
        if (!editingVideo || !editingVideo.title || !editingVideo.youtubeUrl) return;
        setSaving(true);
        try {
            const isNew = !editingVideo.id;
            const res = await fetch(isNew ? '/api/admin/portal/videos' : `/api/admin/portal/videos/${editingVideo.id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingVideo),
            });
            if (res.ok) {
                setEditingVideo(null);
                await fetchVideos();
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteVideo = async (id: string) => {
        if (!confirm('確定刪除此影片？')) return;
        await fetch(`/api/admin/portal/videos/${id}`, { method: 'DELETE' });
        await fetchVideos();
    };

    // Download CRUD
    const saveDownload = async () => {
        if (!editingDownload || !editingDownload.title) return;
        setSaving(true);
        try {
            const isNew = !editingDownload.id;
            const res = await fetch(isNew ? '/api/admin/portal/downloads' : `/api/admin/portal/downloads/${editingDownload.id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingDownload),
            });
            if (res.ok) {
                setEditingDownload(null);
                await fetchDownloads();
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteDownload = async (id: string) => {
        if (!confirm('確定刪除此下載項目？')) return;
        await fetch(`/api/admin/portal/downloads/${id}`, { method: 'DELETE' });
        await fetchDownloads();
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-efan-primary" /></div>;
    }

    return (
        <div className="max-w-5xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">🎬 技術支援管理</h1>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'videos' ? 'bg-white shadow text-efan-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    🎬 教學影片 ({videos.length})
                </button>
                <button
                    onClick={() => setActiveTab('downloads')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'downloads' ? 'bg-white shadow text-efan-primary font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    💾 軟體下載 ({downloads.length})
                </button>
            </div>

            {/* Videos Tab */}
            {activeTab === 'videos' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">管理教學影片，只有登入的客戶能觀看</p>
                        <button
                            onClick={() => setEditingVideo({ title: '', youtubeUrl: '', categoryTag: '', isPublished: true, sortOrder: videos.length })}
                            className="bg-efan-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-efan-primary/90"
                        >
                            + 新增影片
                        </button>
                    </div>

                    {/* Video Form Modal */}
                    {editingVideo && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                                <h3 className="text-lg font-bold mb-4">{editingVideo.id ? '編輯影片' : '新增影片'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">標題 *</label>
                                        <input
                                            value={editingVideo.title || ''}
                                            onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="影片標題"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                                        <input
                                            value={editingVideo.youtubeUrl || ''}
                                            onChange={e => setEditingVideo({ ...editingVideo, youtubeUrl: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                                        <textarea
                                            value={editingVideo.description || ''}
                                            onChange={e => setEditingVideo({ ...editingVideo, description: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                                            <select
                                                value={editingVideo.categoryTag || ''}
                                                onChange={e => setEditingVideo({ ...editingVideo, categoryTag: e.target.value || null })}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="">未分類</option>
                                                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                                            <input
                                                type="number"
                                                value={editingVideo.sortOrder || 0}
                                                onChange={e => setEditingVideo({ ...editingVideo, sortOrder: Number(e.target.value) })}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">自訂縮圖 URL</label>
                                        <input
                                            value={editingVideo.thumbnailUrl || ''}
                                            onChange={e => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value || null })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="留空使用 YouTube 自動擷取"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editingVideo.isPublished ?? true}
                                            onChange={e => setEditingVideo({ ...editingVideo, isPublished: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">上架</span>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setEditingVideo(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                                    <button
                                        onClick={saveVideo}
                                        disabled={saving || !editingVideo.title || !editingVideo.youtubeUrl}
                                        className="bg-efan-primary text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {saving ? '儲存中...' : '儲存'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video List */}
                    <div className="bg-white rounded-xl border divide-y">
                        {videos.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">尚無教學影片</div>
                        ) : (
                            videos.map(v => {
                                const ytId = extractYoutubeId(v.youtubeUrl);
                                const thumb = v.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);
                                return (
                                    <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                                        <span className="text-xs text-gray-400 w-6 text-center">{v.sortOrder}</span>
                                        {thumb && <Image src={thumb} alt="" width={96} height={56} sizes="96px" unoptimized={thumb.startsWith('/api/')} className="w-24 h-14 object-cover rounded" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{v.title}</div>
                                            <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                                                {v.categoryTag && <span className="bg-gray-100 px-2 py-0.5 rounded">{v.categoryTag}</span>}
                                                <span className={v.isPublished ? 'text-green-500' : 'text-red-400'}>{v.isPublished ? '上架' : '下架'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingVideo(v)} className="text-xs text-efan-primary hover:underline">編輯</button>
                                            <button onClick={() => deleteVideo(v.id)} className="text-xs text-red-400 hover:underline">刪除</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Downloads Tab */}
            {activeTab === 'downloads' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">管理軟體下載項目，公開頁面不需登入</p>
                        <button
                            onClick={() => { setUploadedFileName(null); setEditingDownload({ title: '', categoryTag: '', isPublished: true, sortOrder: downloads.length }); }}
                            className="bg-efan-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-efan-primary/90"
                        >
                            + 新增項目
                        </button>
                    </div>

                    {/* Download Form Modal */}
                    {editingDownload && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                                <h3 className="text-lg font-bold mb-4">{editingDownload.id ? '編輯下載項目' : '新增下載項目'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">🖼️ 軟體圖片</label>
                                        <div className="flex items-center gap-4">
                                            {editingDownload.imagePath ? (
                                                <>
                                                    <div className="relative w-20 h-20">
                                                        <Image
                                                            src={`/api/portal/downloads/image?path=${encodeURIComponent(editingDownload.imagePath)}`}
                                                            alt="軟體圖片"
                                                            fill
                                                            sizes="80px"
                                                            unoptimized
                                                            className="object-cover rounded-lg border"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button type="button" onClick={triggerImagePicker} className="text-xs text-efan-primary hover:underline">更換圖片</button>
                                                        <button type="button" onClick={() => setEditingDownload({ ...editingDownload, imagePath: null })} className="text-xs text-red-400 hover:underline">移除</button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={triggerImagePicker}
                                                    disabled={uploadingImage}
                                                    className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-efan-primary hover:text-efan-primary transition-all text-xl"
                                                >
                                                    {uploadingImage ? '⏳' : '📷'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">軟體名稱 *</label>
                                        <input
                                            value={editingDownload.title || ''}
                                            onChange={e => setEditingDownload({ ...editingDownload, title: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                                        <textarea
                                            value={editingDownload.description || ''}
                                            onChange={e => setEditingDownload({ ...editingDownload, description: e.target.value })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">版本號</label>
                                            <input
                                                value={editingDownload.version || ''}
                                                onChange={e => setEditingDownload({ ...editingDownload, version: e.target.value || null })}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                                placeholder="v1.0.0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                                            <select
                                                value={editingDownload.categoryTag || ''}
                                                onChange={e => setEditingDownload({ ...editingDownload, categoryTag: e.target.value || null })}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="">未分類</option>
                                                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">上傳檔案</label>
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${uploading ? 'border-blue-300 bg-blue-50' : editingDownload.filePath ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-efan-primary hover:bg-gray-50'}`}
                                            onClick={() => !uploading && fileInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const f = e.dataTransfer.files?.[0];
                                                if (f) handleFileUpload(f);
                                            }}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={e => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileUpload(f);
                                                }}
                                            />
                                            {uploading ? (
                                                <div className="text-blue-600 text-sm font-medium">⏳ 上傳中...</div>
                                            ) : editingDownload.filePath ? (
                                                <div>
                                                    <div className="text-green-600 text-sm font-medium">✅ {uploadedFileName || editingDownload.filePath}</div>
                                                    {editingDownload.fileSize && (
                                                        <div className="text-xs text-gray-400 mt-1">{(editingDownload.fileSize / 1024 / 1024).toFixed(1)} MB</div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-1">點此重新上傳</div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-3xl mb-2">📁</div>
                                                    <div className="text-sm text-gray-500">點擊或拖放檔案至此</div>
                                                    <div className="text-xs text-gray-400 mt-1">上限 200MB</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">或輸入外部連結</label>
                                        <input
                                            value={editingDownload.externalUrl || ''}
                                            onChange={e => setEditingDownload({ ...editingDownload, externalUrl: e.target.value || null })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="https://..."
                                        />
                                        <p className="text-xs text-gray-400 mt-1">上傳檔案優先，未上傳則使用外部連結</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">📄 PDF 說明書</label>
                                        <div className="flex items-center gap-3">
                                            {editingDownload.manualPath ? (
                                                <>
                                                    <span className="text-green-600 text-sm">✅ 已上傳</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingDownload({ ...editingDownload, manualPath: null })}
                                                        className="text-xs text-red-400 hover:underline"
                                                    >移除</button>
                                                    <button
                                                        type="button"
                                                        onClick={triggerManualPicker}
                                                        className="text-xs text-efan-primary hover:underline"
                                                    >重新上傳</button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={triggerManualPicker}
                                                    disabled={uploadingManual}
                                                    className="text-sm px-4 py-2 border border-dashed rounded-lg hover:border-efan-primary hover:bg-gray-50 transition-all"
                                                >
                                                    {uploadingManual ? '⏳ 上傳中...' : '📄 上傳 PDF 說明書'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                                        <input
                                            type="number"
                                            value={editingDownload.sortOrder || 0}
                                            onChange={e => setEditingDownload({ ...editingDownload, sortOrder: Number(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editingDownload.isPublished ?? true}
                                            onChange={e => setEditingDownload({ ...editingDownload, isPublished: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">上架</span>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button onClick={() => setEditingDownload(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                                    <button
                                        onClick={saveDownload}
                                        disabled={saving || !editingDownload.title}
                                        className="bg-efan-primary text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {saving ? '儲存中...' : '儲存'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Download List */}
                    <div className="bg-white rounded-xl border divide-y">
                        {downloads.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">尚無下載項目</div>
                        ) : (
                            downloads.map(d => (
                                <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                                    <span className="text-xs text-gray-400 w-6 text-center">{d.sortOrder}</span>
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">📦</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{d.title}</div>
                                        <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                                            {d.version && <span>{d.version}</span>}
                                            {d.categoryTag && <span className="bg-gray-100 px-2 py-0.5 rounded">{d.categoryTag}</span>}
                                            {d.fileSize && <span>{(d.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                                            <span className={d.isPublished ? 'text-green-500' : 'text-red-400'}>{d.isPublished ? '上架' : '下架'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingDownload(d)} className="text-xs text-efan-primary hover:underline">編輯</button>
                                        <button onClick={() => deleteDownload(d.id)} className="text-xs text-red-400 hover:underline">刪除</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
