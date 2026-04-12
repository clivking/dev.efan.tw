import type { Metadata } from 'next';

export const metadata: Metadata = {
    alternates: {
        canonical: 'https://dev.efan.tw/quote-request',
    },
};

export default function QuoteRequestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
