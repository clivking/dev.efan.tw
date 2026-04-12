import React from 'react';
import { AlertCircle, FileX, Clock, Clock4 } from 'lucide-react';
import Image from 'next/image';
import { formatPhoneNumber } from '@/lib/phone-format';

interface Props {
    type: 'not_found' | 'deactivated' | 'expired' | 'not_ready';
    companyInfo: {
        name: string;
        phone: string;
        email: string;
        address: string;
        logoUrl?: string;
    };
}

const config = {
    not_found: {
        icon: FileX,
        title: '找不到此頁面',
        message: '此連結可能已失效或不存在。',
    },
    deactivated: {
        icon: AlertCircle,
        title: '連結已失效',
        message: '此報價連結已停用，請聯繫我們取得新連結。',
    },
    expired: {
        icon: Clock,
        title: '連結已過期',
        message: '此報價連結已過期。',
    },
    not_ready: {
        icon: Clock4,
        title: '報價單準備中',
        message: '報價單尚未送出，請稍候。',
    },
};

export function QuoteStatusPage({ type, companyInfo }: Props) {
    const { icon: Icon, title, message } = config[type];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
                {companyInfo.logoUrl && (
                    <div className="mb-8 flex justify-center">
                        <Image
                            src={companyInfo.logoUrl}
                            alt={companyInfo.name}
                            width={160}
                            height={60}
                            className="object-contain"
                        />
                    </div>
                )}

                <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-gray-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
                <p className="text-gray-600 mb-10">{message}</p>

                <div className="border-t pt-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">有疑問？請聯繫我們</h3>
                    <p className="text-gray-600 font-medium">{companyInfo.name}</p>
                    <div className="text-gray-500 text-sm mt-2 space-y-1">
                        <p>📞 {formatPhoneNumber(companyInfo.phone)}</p>
                        <p>✉️ {companyInfo.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
