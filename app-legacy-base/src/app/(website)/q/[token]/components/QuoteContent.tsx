import React from 'react';
import Image from 'next/image';
import { formatPhoneNumber } from '@/lib/phone-format';

const BRAND = {
    primary: "#1B3A5C",
    primaryLight: "#2A5A8C",
    accent: "#E8792B",
    accentLight: "#FFF3EB",
    teal: "#0D7377",
    tealLight: "#E6F5F5",
    gray50: "#FAFBFC",
    gray100: "#F3F5F7",
    gray200: "#CBD5E1",
    gray400: "#64748B",
    gray600: "#475569",
    gray800: "#2D3748",
    gray900: "#1A202C",
    white: "#FFFFFF",
};

export function QuoteHeader({ quote, company }: { quote: any, company: any }) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
                <div className="flex flex-col items-center gap-1 group">
                    {company.logoUrl ? (
                        <div className="relative w-20 h-20 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center p-2">
                            <Image src={company.logoUrl} alt={company.name} width={64} height={64} className="object-contain" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-[#1B3A5C] rounded-xl flex items-center justify-center text-white font-black text-xl">EFAN</div>
                    )}
                    <span className="text-[8px] font-black tracking-widest opacity-40 uppercase" style={{ color: BRAND.gray400 }}>Since 1984</span>
                </div>

                <div className="flex flex-col min-w-[210px]">
                    <h1 className="text-lg md:text-xl font-black font-serif" style={{ color: BRAND.primary, textAlignLast: 'justify' }}>{company.name}</h1>
                    <div className="flex flex-col mt-1 space-y-0.5">
                        <div className="w-full text-[11px] font-bold tracking-tight uppercase" style={{ color: BRAND.gray400, textAlignLast: 'justify' }}>
                            智慧安防系統整合｜門禁｜監視｜電話｜網路
                        </div>
                        <p className="text-[12px] font-medium whitespace-nowrap" style={{ color: BRAND.gray400 }}>{company.address}</p>
                        <p className="text-[12px] font-medium whitespace-nowrap" style={{ color: BRAND.gray400 }}>{formatPhoneNumber(company.phone)} | {company.email}</p>
                    </div>
                </div>
            </div>

            <div className="text-left md:text-right space-y-1 text-[13px]" style={{ color: BRAND.gray600 }}>
                <div>報價編號：<span className="font-bold" style={{ color: BRAND.gray900 }}>{quote.quoteNumber}</span></div>
                <div>報價日期：{quote.createdAt.split('T')[0].replace(/-/g, '/')}</div>
                {quote.validUntil && (
                    <div>有效期限：<span className="font-bold" style={{ color: BRAND.accent }}>{quote.validUntil.split('T')[0].replace(/-/g, '/')}</span></div>
                )}
            </div>
        </div>
    );
}

export function CustomerInfo({ customer }: { customer: any }) {
    return (
        <div className="mb-6 p-5 rounded-lg border-l-4 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-12 text-[14px] items-start"
            style={{ backgroundColor: BRAND.gray50, borderLeftColor: BRAND.teal }}>
            {customer?.companyName && (
                <div className="flex items-start gap-2">
                    <span className="w-16 shrink-0 opacity-50 font-medium" style={{ color: BRAND.gray400 }}>公司名稱</span>
                    <span className="opacity-20">|</span>
                    <span className="font-bold flex-1" style={{ color: BRAND.gray900 }}>{customer.companyName}</span>
                </div>
            )}
            <div className="flex items-start gap-2">
                <span className="w-16 shrink-0 opacity-50 font-medium" style={{ color: BRAND.gray400 }}>聯絡窗口</span>
                <span className="opacity-20">|</span>
                <div className="flex flex-col flex-1">
                    <span className="font-bold" style={{ color: BRAND.gray900 }}>{customer?.contactName || '無'}</span>
                    {(customer?.contactPhone || customer?.contactMobile) && (
                        <span className="text-[11px] font-medium opacity-60" style={{ color: BRAND.gray800 }}>
                            {formatPhoneNumber(customer?.contactPhone)}{customer?.contactPhone && customer?.contactMobile && ' / '}{formatPhoneNumber(customer?.contactMobile)}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-start gap-2">
                <span className="w-16 shrink-0 opacity-50 font-medium" style={{ color: BRAND.gray400 }}>案場地址</span>
                <span className="opacity-20">|</span>
                <span className="font-bold flex-1" style={{ color: BRAND.gray900 }}>{customer?.locationAddress || '同通訊地址'}</span>
            </div>
            {customer?.taxId ? (
                <div className="flex items-start gap-2">
                    <span className="w-16 shrink-0 opacity-50 font-medium" style={{ color: BRAND.gray400 }}>統一編號</span>
                    <span className="opacity-20">|</span>
                    <span className="font-bold flex-1 tracking-wider" style={{ color: BRAND.gray900 }}>{customer?.taxId}</span>
                </div>
            ) : (
                <div className="hidden md:block"></div>
            )}
        </div>
    );
}

export function QuoteItemsTable({ items }: { items: any[] }) {
    return (
        <div className="hidden md:block mb-8">
            <table className="w-full text-left border-collapse table-fixed">
                <thead>
                    <tr style={{ backgroundColor: BRAND.primary }}>
                        <th className="py-2.5 px-3 text-[13px] font-bold text-white w-10 text-center rounded-tl-md">#</th>
                        <th className="py-2.5 px-4 text-[13px] font-bold text-white uppercase tracking-tight">品名 / 說明</th>
                        <th className="py-2.5 px-2 text-[13px] font-bold text-white text-center w-14">數量</th>
                        <th className="py-2.5 px-2 text-[13px] font-bold text-white text-center w-14">單位</th>
                        <th className="py-2.5 px-3 text-[13px] font-bold text-white text-right w-24">單價</th>
                        <th className="py-2.5 px-3 text-[13px] font-bold text-white text-right w-28 rounded-tr-md">小計</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={item.id} className="border-b" style={{ borderColor: BRAND.gray200 }}>
                            <td className="py-3.5 px-3 text-center text-[13px] font-bold" style={{ color: BRAND.gray400 }}>{idx + 1}</td>
                            <td className="py-3.5 px-4">
                                <div className="text-[15px] font-bold leading-tight" style={{ color: BRAND.gray900 }}>{item.name}</div>
                                {item.description && (
                                    <div className="text-[13px] mt-1 whitespace-pre-wrap leading-relaxed" style={{ color: BRAND.gray600 }}>
                                        {item.description}
                                    </div>
                                )}
                                {item.customerNote && (
                                    <div className="text-[12px] mt-1 italic font-bold" style={{ color: BRAND.teal }}>
                                        備註: {item.customerNote}
                                    </div>
                                )}
                            </td>
                            <td className="py-3.5 px-2 text-center text-[13px] shrink-0">
                                {item.quantity === 0 ? <span className="text-orange-600 font-bold">選購</span> : item.quantity}
                            </td>
                            <td className="py-3.5 px-2 text-center text-[13px]" style={{ color: BRAND.gray600 }}>{item.unit}</td>
                            <td className="py-3.5 px-3 text-right text-[13px]" style={{ color: BRAND.gray800 }}>${item.unitPrice.toLocaleString()}</td>
                            <td className="py-3.5 px-3 text-right text-[13px] font-bold" style={{ color: BRAND.gray900 }}>${item.subtotal.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function QuoteItemCards({ items }: { items: any[] }) {
    return (
        <div className="md:hidden space-y-4 mb-8">
            {items.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                    <div className="font-bold text-gray-900 mb-1">{item.name}</div>
                    {(item.description || item.customerNote) && (
                        <div className="text-sm text-gray-500 mb-3 whitespace-pre-wrap">
                            {item.description}
                            {item.customerNote && <div className="mt-1 text-blue-600 block">備註: {item.customerNote}</div>}
                        </div>
                    )}
                    <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                        <div className="text-sm text-gray-600">
                            {item.quantity} {item.unit} × ${item.unitPrice.toLocaleString()}
                        </div>
                        <div className="font-bold text-gray-900">
                            ${item.subtotal.toLocaleString()}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function PricingSummary({ quote, pricing }: { quote: any, pricing: any }) {
    return (
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start mb-10">
            <div className="flex-1 min-w-0">
                {quote.customerNote && (
                    <div className="p-4 rounded-lg border-l-3 text-[10.5px] leading-relaxed"
                        style={{ backgroundColor: BRAND.accentLight, borderLeftColor: BRAND.accent }}>
                        <span className="font-bold opacity-80 uppercase block mb-1">📝 工程說明與保固條款</span>
                        <div className="whitespace-pre-wrap">{quote.customerNote}</div>
                    </div>
                )}
            </div>

            <div className="w-full md:w-72 shrink-0">
                <div className="space-y-1.5 px-3 mb-2">
                    <div className="flex justify-between text-[13px]" style={{ color: BRAND.gray600 }}>
                        <span className="font-medium">小計</span>
                        <span className="font-bold">$ {pricing.subtotalWithTax.toLocaleString()}</span>
                    </div>

                    {pricing.discountAmount > 0 && (
                        <div className="flex justify-between p-1.5 rounded text-[13px] font-bold" style={{ backgroundColor: "#FFF7ED", color: "#F97316" }}>
                            <span>優惠折扣 {pricing.discountNote ? `(${pricing.discountNote})` : ''}</span>
                            <span>-$ {pricing.discountAmount.toLocaleString()}</span>
                        </div>
                    )}

                    {pricing.transportFee > 0 && (
                        <div className="flex justify-between text-[13px]" style={{ color: BRAND.gray600 }}>
                            <span className="font-medium">車馬費 / 運費</span>
                            <span className="font-bold">$ {pricing.transportFee.toLocaleString()}</span>
                        </div>
                    )}

                    {pricing.taxAmount > 0 && (
                        <div className="flex justify-between text-[13px] pt-1" style={{ color: BRAND.gray600 }}>
                            <div className="flex flex-col">
                                <span className="font-medium">{(pricing.discountAmount > 0 || pricing.transportFee > 0) ? '應計小計' : '小計'}</span>
                                <span className="text-[11px] opacity-60">營業稅 ({Math.round((pricing.taxAmount / (pricing.beforeTax || 1)) * 100)}%)</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="font-bold">$ {pricing.beforeTax.toLocaleString()}</span>
                                <span className="text-[11px] opacity-60">$ {pricing.taxAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grand-total-row p-3 rounded-xl flex justify-between items-center text-white"
                    style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})` }}>
                    <span className="font-bold text-xs tracking-[2px]">金額總計</span>
                    <span className="text-xl font-black">$ {pricing.totalAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

export function SignaturePlaceholder() {
    return (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">如對此報價沒有疑問，請在下方簽名確認。</h3>
            <p className="text-gray-500 mb-6">（電子簽名功能即將開放）</p>
            <div className="h-32 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400 font-medium italic">Signature Placeholder</span>
            </div>
        </div>
    );
}

export function SignedBanner({ signature }: { signature: any }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    if (!signature) return null;
    return (
        <div className="bg-green-50 text-green-800 border-2 border-green-200 rounded-xl p-6 mb-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center">
                    <span className="bg-green-100 text-green-700 p-1 rounded-full mr-2">✅</span> 報價已簽回
                </h3>
                <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    {mounted ? new Date(signature.signedAt).toLocaleString('zh-TW', { hour12: false }) : ''}
                </span>
            </div>
            <div className="bg-white p-4 rounded-lg flex items-center gap-6">
                <div className="shrink-0 text-sm">
                    <p className="font-bold text-gray-900 mb-1">{signature.signerName}</p>
                    <p className="text-gray-500">{signature.signerTitle}</p>
                </div>
                <div className="h-16 w-48 border-l pl-6 flex items-center">
                    <Image src={signature.signatureImage.startsWith('/uploads/') ? `/api${signature.signatureImage}` : signature.signatureImage} alt="簽名" width={150} height={50} className="object-contain" />
                </div>
            </div>
        </div>
    );
}

export function QuoteFooter({ company }: { company: any }) {
    return (
        <div className="mt-12 flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="flex items-center gap-4">
                <span className="text-[13px] font-bold" style={{ color: BRAND.gray900 }}>公司用印</span>
                <div className="w-44 h-44 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden" style={{ borderColor: BRAND.gray200 }}>
                    {company.stampUrl ? (
                        <Image src={company.stampUrl} alt="Company Stamp" width={160} height={160} className="object-contain" />
                    ) : (
                        <span className="text-[10px] text-gray-300 font-bold uppercase italic">Official Stamp</span>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="text-[11px] font-medium flex items-center gap-1.5 opacity-80" style={{ color: BRAND.gray600 }}>
                    <span>如有疑問歡迎來電：</span>
                    <span className="font-bold">02-7730-1158 #601 陳小姐</span>
                </div>
            </div>
        </div>
    );
}
