'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface DocumentItem {
    id: string;
    filename: string;
    filepath: string;
    mimetype: string | null;
    size: number | null;
    sortOrder: number;
    title: string | null;
    description: string | null;
    docType: string | null;
}

interface DocumentUploaderProps {
    productId: string;
    documents: DocumentItem[];
    onUpdate: (docs: DocumentItem[]) => void;
}

const DOC_TYPES = [
    { value: 'manual', label: '說明書' },
    { value: 'dm', label: 'DM' },
    { value: 'spec', label: '規格表' },
    { value: 'install', label: '安裝說明' },
    { value: 'other', label: '其他' },
] as const;

function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploader({ productId, documents, onUpdate }: DocumentUploaderProps) {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDesc, setUploadDesc] = useState('');
    const [uploadType, setUploadType] = useState<(typeof DOC_TYPES)[number]['value']>('manual');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            toast.error('請先選擇檔案');
            return;
        }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('title', uploadTitle);
            fd.append('description', uploadDesc);
            fd.append('docType', uploadType);
            const docRes = await fetch(`/api/products/${productId}/documents`, {
                method: 'POST',
                body: fd,
            });
            const docData = await docRes.json();
            if (!docRes.ok) throw new Error(docData.error || '建立文件紀錄失敗');

            onUpdate([...documents, docData.document]);
            toast.success('文件已上傳');
            setShowUploadForm(false);
            setUploadTitle('');
            setUploadDesc('');
            setUploadType('manual');
            if (fileRef.current) fileRef.current.value = '';
        } catch (err: any) {
            toast.error(err.message || '文件上傳失敗');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('確定要刪除這份文件嗎？')) return;

        try {
            const res = await fetch(`/api/products/${productId}/documents/${docId}`, { method: 'DELETE' });
            if (!res.ok) {
                toast.error('刪除文件失敗');
                return;
            }

            onUpdate(documents.filter((doc) => doc.id !== docId));
            toast.success('文件已刪除');
        } catch {
            toast.error('刪除文件失敗');
        }
    };

    return (
        <div className="space-y-4">
            {documents.map((doc) => (
                <div key={doc.id} className="group flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-sm font-black text-gray-700 shadow-sm">
                        {doc.mimetype?.includes('pdf') ? 'PDF' : '檔案'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-gray-800">{doc.title || doc.filename}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            {doc.docType ? (
                                <span className="rounded-lg border border-gray-100 bg-white px-2 py-0.5 font-bold">
                                    {DOC_TYPES.find((item) => item.value === doc.docType)?.label || doc.docType}
                                </span>
                            ) : null}
                            {doc.size ? <span>{formatFileSize(doc.size)}</span> : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 bg-white text-xs text-gray-300 opacity-0 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    >
                        刪
                    </button>
                </div>
            ))}

            {showUploadForm ? (
                <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                    <div className="space-y-2">
                        <label className="pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">選擇檔案</label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-bold file:text-gray-700 hover:file:bg-gray-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">文件標題</label>
                            <input
                                type="text"
                                placeholder="例如：AR-837-E 說明書"
                                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-efan-primary"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">文件類型</label>
                            <select
                                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-efan-primary"
                                value={uploadType}
                                onChange={(e) => setUploadType(e.target.value as (typeof DOC_TYPES)[number]['value'])}
                            >
                                {DOC_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="pl-2 text-[10px] font-black uppercase tracking-widest text-gray-400">文件說明</label>
                        <input
                            type="text"
                            placeholder="可補充這份文件的用途或版本資訊"
                            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-efan-primary"
                            value={uploadDesc}
                            onChange={(e) => setUploadDesc(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="rounded-xl bg-efan-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-efan-primary-light disabled:opacity-50"
                        >
                            {uploading ? '上傳中...' : '上傳文件'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowUploadForm(false)}
                            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-100"
                        >
                            取消
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowUploadForm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-bold text-gray-400 transition-all hover:border-efan-primary hover:bg-efan-primary/5 hover:text-efan-primary"
                >
                    ＋ 上傳相關文件
                </button>
            )}
        </div>
    );
}
