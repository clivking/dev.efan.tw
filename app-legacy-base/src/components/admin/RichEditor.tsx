'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { sharedExtensions } from '@/lib/tiptap-extensions';
import { useCallback, useRef } from 'react';

interface RichEditorProps {
    content?: any;
    onChange: (json: any) => void;
    placeholder?: string;
}

function ToolbarButton({ active, onClick, children, title }: {
    active?: boolean; onClick: () => void; children: React.ReactNode; title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                active
                    ? 'bg-efan-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
        >
            {children}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'products');
        fd.append('entityType', 'content_image');

        try {
            const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.url) {
                editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
            }
        } catch {
            // silently fail
        }
        e.target.value = '';
    }, [editor]);

    const addLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('輸入連結 URL', previousUrl || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
        }
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="粗體">
                <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜體">
                <em>I</em>
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="底線">
                <u>U</u>
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2 標題">
                H2
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3 標題">
                H3
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="無序列表">
                ☰
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">
                1.
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用">
                ❝
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <ToolbarButton onClick={() => fileInputRef.current?.click()} title="插入圖片">
                🖼️
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('link')} onClick={addLink} title="插入連結">
                🔗
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔線">
                ─
            </ToolbarButton>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div>
    );
}

export default function RichEditor({ content, onChange, placeholder = '開始輸入產品介紹...' }: RichEditorProps) {
    const editor = useEditor({
        extensions: [
            ...sharedExtensions,
            Placeholder.configure({ placeholder }),
        ],
        content: content || undefined,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none p-6 min-h-[300px] focus:outline-none',
            },
        },
        onUpdate: ({ editor: e }) => {
            onChange(e.getHTML());
        },
    });

    if (!editor) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white animate-pulse">
                <div className="h-12 bg-gray-50 rounded-t-2xl" />
                <div className="h-[300px]" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
