import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';

// Shared extensions used by both:
// 1. Admin: RichEditor.tsx (client-side editing)
// 2. Server: lib/tiptap.ts (JSON → HTML rendering)
// Must stay in sync — adding an extension here applies to both sides.
export const sharedExtensions = [
    StarterKit,
    Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' } }),
    Underline,
];

// Lightweight extensions for websiteDescription (product features).
// Only bold + bullet list. Used by LightEditor.tsx (client-side only).
export const lightExtensions = [
    StarterKit.configure({
        heading: false,
        italic: false,
        strike: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        orderedList: false,
        horizontalRule: false,
    }),
];
