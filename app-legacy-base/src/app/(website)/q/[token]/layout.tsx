import { Noto_Serif_TC } from 'next/font/google';
import ChatWidget from '@/components/chat/ChatWidget';

const notoSerifTC = Noto_Serif_TC({
    subsets: ['latin'],
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-noto-serif',
});

export const metadata = {
    robots: 'noindex, nofollow',
};

export default function QuoteViewLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`min-h-screen bg-gray-50 text-gray-900 pb-16 ${notoSerifTC.variable}`}>
            {children}
            <ChatWidget source="web_quote" />
        </div>
    );
}
