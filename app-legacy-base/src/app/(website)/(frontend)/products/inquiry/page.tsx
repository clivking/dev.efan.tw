import { Metadata } from 'next';
import InquiryPageClient from './InquiryPageClient';

export const metadata: Metadata = {
    title: '詢價清單',
    description: '提交您的詢價需求，我們將盡快為您報價。',
};

export default function InquiryPage() {
    return <InquiryPageClient />;
}
