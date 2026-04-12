'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { lightExtensions } from '@/lib/tiptap-extensions';

interface LightEditorProps {
    content?: string;          // HTML string
    onChange: (html: string) => void;
    placeholder?: string;
}

function LightToolbar({ editor }: { editor: Editor }) {
    return (
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="粗體"
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    editor.isActive('bold')
                        ? 'bg-efan-primary text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                <strong>B</strong>
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="項目符號"
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    editor.isActive('bulletList')
                        ? 'bg-efan-primary text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                •
            </button>
        </div>
    );
}

export default function LightEditor({ content, onChange, placeholder = '輸入產品特點...' }: LightEditorProps) {
    const editor = useEditor({
        extensions: [
            ...lightExtensions,
            Placeholder.configure({ placeholder }),
        ],
        content: content || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none p-4 min-h-[120px] focus:outline-none',
            },
        },
        onUpdate: ({ editor: e }) => {
            // Output HTML (not JSON) for websiteDescription
            const html = e.getHTML();
            // TipTap returns <p></p> for empty content
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    if (!editor) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white animate-pulse">
                <div className="h-10 bg-gray-50 rounded-t-xl" />
                <div className="h-[120px]" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <LightToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
