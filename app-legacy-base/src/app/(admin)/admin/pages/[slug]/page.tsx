'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import ContentMetadataSection from '@/components/admin/ContentMetadataSection';
import { GUIDE_SEARCH_INTENTS } from '@/lib/guide-schema';

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false });

// ===== Shared Components =====

function CollapsibleSection({ title, defaultOpen = true, children }: {
    title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <span className="font-semibold text-gray-900">{title}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="p-5 space-y-4">{children}</div>}
        </div>
    );
}

function ListEditor({ items, fields, onUpdate, addLabel = '+ 新增' }: {
    items: any[];
    fields: { key: string; label: string; type?: 'input' | 'textarea' }[];
    onUpdate: (items: any[]) => void;
    addLabel?: string;
}) {
    const handleChange = (index: number, key: string, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [key]: value };
        onUpdate(newItems);
    };
    const handleAdd = () => {
        const newItem: any = {};
        fields.forEach(f => { newItem[f.key] = ''; });
        onUpdate([...items, newItem]);
    };
    const handleRemove = (index: number) => {
        onUpdate(items.filter((_, i) => i !== index));
    };
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        const newItems = [...items];
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        onUpdate(newItems);
    };

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col gap-1 pt-1">
                        <button type="button" onClick={() => handleMove(i, 'up')} disabled={i === 0}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▲</button>
                        <button type="button" onClick={() => handleMove(i, 'down')} disabled={i === items.length - 1}
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs">▼</button>
                    </div>
                    <div className="flex-1 space-y-2">
                        {fields.map(f => (
                            <div key={f.key}>
                                <label className="text-xs text-gray-500">{f.label}</label>
                                {f.type === 'textarea' ? (
                                    <textarea value={item[f.key] || ''} onChange={e => handleChange(i, f.key, e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md" rows={2} />
                                ) : (
                                    <input type="text" value={item[f.key] || ''} onChange={e => handleChange(i, f.key, e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md" />
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => handleRemove(i)}
                        className="text-red-400 hover:text-red-600 p-1 text-lg">×</button>
                </div>
            ))}
            <button type="button" onClick={handleAdd}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-efan-primary hover:text-efan-primary transition-colors">
                {addLabel}
            </button>
        </div>
    );
}

// ===== Page Type Editors =====

function HomeEditor({ sections, onChange }: { sections: any; onChange: (s: any) => void }) {
    const update = (key: string, value: any) => onChange({ ...sections, [key]: value });
    const updateNested = (key: string, field: string, value: any) => {
        onChange({ ...sections, [key]: { ...sections[key], [field]: value } });
    };

    return (
        <div className="space-y-4">
            <CollapsibleSection title="▼ Hero 區塊">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Badge 文字</label>
                        <input type="text" value={sections.hero?.badge || ''} onChange={e => updateNested('hero', 'badge', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">主標題 <span className="text-gray-400">(\\n 換行)</span></label>
                        <textarea value={sections.hero?.heading || ''} onChange={e => updateNested('hero', 'heading', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700">CTA 主按鈕</label>
                            <input type="text" value={sections.hero?.ctaPrimary || ''} onChange={e => updateNested('hero', 'ctaPrimary', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">CTA 次按鈕</label>
                            <input type="text" value={sections.hero?.ctaSecondary || ''} onChange={e => updateNested('hero', 'ctaSecondary', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Stats 數字</label>
                        <ListEditor items={sections.hero?.stats || []}
                            fields={[{ key: 'value', label: '數值' }, { key: 'label', label: '標籤' }, { key: 'icon', label: 'Icon' }]}
                            onUpdate={stats => updateNested('hero', 'stats', stats)} addLabel="+ 新增數據" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="▼ 知名客戶">
                <div>
                    <label className="text-sm font-medium text-gray-700">區塊標題</label>
                    <input type="text" value={sections.clientLogos?.title || ''} onChange={e => updateNested('clientLogos', 'title', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <ListEditor items={sections.clientLogos?.clients || []}
                    fields={[{ key: 'name', label: '客戶名稱' }, { key: 'logo', label: 'Logo 路徑 (選填)' }]}
                    onUpdate={clients => updateNested('clientLogos', 'clients', clients)} addLabel="+ 新增客戶" />
            </CollapsibleSection>

            <CollapsibleSection title="▼ 服務總覽">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">標題</label>
                        <input type="text" value={sections.services?.heading || ''} onChange={e => updateNested('services', 'heading', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">副標題</label>
                        <input type="text" value={sections.services?.subtitle || ''} onChange={e => updateNested('services', 'subtitle', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">服務項目</label>
                        <ListEditor items={sections.services?.items || []}
                            fields={[
                                { key: 'name', label: '名稱' }, { key: 'icon', label: 'Icon' },
                                { key: 'shortDesc', label: '簡述' }, { key: 'link', label: '連結' },
                            ]}
                            onUpdate={items => updateNested('services', 'items', items)} addLabel="+ 新增服務" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="▼ 為什麼選擇我們">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">標題</label>
                        <input type="text" value={sections.features?.heading || ''} onChange={e => updateNested('features', 'heading', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">優勢列表</label>
                        <ListEditor items={sections.features?.items || []}
                            fields={[
                                { key: 'number', label: '編號' }, { key: 'title', label: '標題' },
                                { key: 'description', label: '描述', type: 'textarea' },
                            ]}
                            onUpdate={items => updateNested('features', 'items', items)} addLabel="+ 新增優勢" />
                    </div>
                    <div className="border-t pt-4">
                        <label className="text-sm font-medium text-gray-700 block mb-2">客戶見證</label>
                        <textarea value={sections.features?.testimonial?.quote || ''}
                            onChange={e => update('features', { ...sections.features, testimonial: { ...sections.features?.testimonial, quote: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} placeholder="客戶引言" />
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <input type="text" value={sections.features?.testimonial?.author || ''}
                                onChange={e => update('features', { ...sections.features, testimonial: { ...sections.features?.testimonial, author: e.target.value } })}
                                className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="作者" />
                            <input type="text" value={sections.features?.testimonial?.company || ''}
                                onChange={e => update('features', { ...sections.features, testimonial: { ...sections.features?.testimonial, company: e.target.value } })}
                                className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="公司/職稱" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="▼ 行動呼籲 CTA">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">標題</label>
                        <textarea value={sections.cta?.heading || ''} onChange={e => updateNested('cta', 'heading', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700">按鈕文字</label>
                            <input type="text" value={sections.cta?.buttonText || ''} onChange={e => updateNested('cta', 'buttonText', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">按鈕連結</label>
                            <input type="text" value={sections.cta?.buttonLink || ''} onChange={e => updateNested('cta', 'buttonLink', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">電話</label>
                        <input type="text" value={sections.cta?.phone || ''} onChange={e => updateNested('cta', 'phone', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="留空自動使用公司電話" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="▼ 常見問題 FAQ">
                <div>
                    <label className="text-sm font-medium text-gray-700">區塊標題</label>
                    <input type="text" value={sections.faq?.title || ''} onChange={e => updateNested('faq', 'title', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <ListEditor items={sections.faq?.items || []}
                    fields={[{ key: 'question', label: '問題' }, { key: 'answer', label: '回答', type: 'textarea' }]}
                    onUpdate={items => updateNested('faq', 'items', items)} addLabel="+ 新增問答" />
            </CollapsibleSection>
        </div>
    );
}

function ServiceEditor({ sections, onChange }: { sections: any; onChange: (s: any) => void }) {
    const update = (key: string, value: any) => onChange({ ...sections, [key]: value });
    const updateHero = (field: string, value: any) => {
        onChange({ ...sections, hero: { ...sections.hero, [field]: value } });
    };
    const updateCta = (field: string, value: any) => {
        onChange({ ...sections, cta: { ...sections.cta, [field]: value } });
    };
    const updateAssessment = (field: string, value: any) => {
        onChange({ ...sections, freeAssessment: { ...sections.freeAssessment, [field]: value } });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">服務名稱</label>
                        <input type="text" value={sections.hero?.name || ''} onChange={e => updateHero('name', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Icon</label>
                        <input type="text" value={sections.hero?.icon || ''} onChange={e => updateHero('icon', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="shield / camera / phone..." />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">服務描述（Hero 用）</label>
                    <textarea value={sections.hero?.description || ''} onChange={e => updateHero('description', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">詳細說明</label>
                    <textarea value={sections.longDesc || ''} onChange={e => update('longDesc', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={4} />
                </div>
            </div>

            <CollapsibleSection title="▼ 特色列表">
                <ListEditor items={sections.features || []}
                    fields={[{ key: 'title', label: '標題' }, { key: 'description', label: '描述', type: 'textarea' }]}
                    onUpdate={items => update('features', items)} addLabel="+ 新增特色" />
            </CollapsibleSection>

            <CollapsibleSection title="▼ 適用對象">
                <ListEditor items={(sections.targets || []).map((t: string) => ({ text: t }))}
                    fields={[{ key: 'text', label: '對象' }]}
                    onUpdate={items => update('targets', items.map((i: any) => i.text))} addLabel="+ 新增對象" />
            </CollapsibleSection>

            <CollapsibleSection title="▼ 免費評估">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">標題</label>
                        <input type="text" value={sections.freeAssessment?.title || ''} onChange={e => updateAssessment('title', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">說明</label>
                        <textarea value={sections.freeAssessment?.description || ''} onChange={e => updateAssessment('description', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">電話</label>
                        <input type="text" value={sections.freeAssessment?.phone || ''} onChange={e => updateAssessment('phone', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="留空自動使用公司電話" />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="▼ CTA（行動呼籲）">
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">標題</label>
                        <input type="text" value={sections.cta?.heading || ''} onChange={e => updateCta('heading', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">副標</label>
                        <textarea value={sections.cta?.subtitle || ''} onChange={e => updateCta('subtitle', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700">按鈕文字</label>
                            <input type="text" value={sections.cta?.buttonText || ''} onChange={e => updateCta('buttonText', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">按鈕連結</label>
                            <input type="text" value={sections.cta?.buttonLink || ''} onChange={e => updateCta('buttonLink', e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
}

function ContactEditor({ sections, onChange }: { sections: any; onChange: (s: any) => void }) {
    const update = (key: string, value: any) => onChange({ ...sections, [key]: value });
    const updateHero = (field: string, value: any) => {
        onChange({ ...sections, hero: { ...sections.hero, [field]: value } });
    };
    const updateMap = (field: string, value: string) => {
        onChange({ ...sections, mapCoordinates: { ...sections.mapCoordinates, [field]: parseFloat(value) || 0 } });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-gray-700">Hero 標題</label>
                    <input type="text" value={sections.hero?.title || ''} onChange={e => updateHero('title', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Hero 副標</label>
                    <input type="text" value={sections.hero?.subtitle || ''} onChange={e => updateHero('subtitle', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
            </div>

            <CollapsibleSection title="▼ 營業時間">
                <ListEditor items={sections.businessHours || []}
                    fields={[{ key: 'days', label: '日期' }, { key: 'hours', label: '時間' }]}
                    onUpdate={items => update('businessHours', items)} addLabel="+ 新增時段" />
                <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">營業時間備註</label>
                    <input type="text" value={sections.businessHoursNote || ''} onChange={e => update('businessHoursNote', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
            </CollapsibleSection>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">表單標題</label>
                        <input type="text" value={sections.formTitle || ''} onChange={e => update('formTitle', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">表單副標</label>
                        <input type="text" value={sections.formSubtitle || ''} onChange={e => update('formSubtitle', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">地圖緯度</label>
                        <input type="number" step="0.0001" value={sections.mapCoordinates?.lat || ''} onChange={e => updateMap('lat', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">地圖經度</label>
                        <input type="number" step="0.0001" value={sections.mapCoordinates?.lng || ''} onChange={e => updateMap('lng', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">額外說明（選填）</label>
                    <textarea value={sections.additionalNote || ''} onChange={e => update('additionalNote', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
            </div>
        </div>
    );
}

// ===== Main Page Editor =====

function formatDateTimeLocal(value: unknown) {
    if (!value || typeof value !== 'string') return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    const hours = `${parsed.getHours()}`.padStart(2, '0');
    const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminPageEditorPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [page, setPage] = useState<any>(null);
    const [sections, setSections] = useState<any>({});
    const [richContent, setRichContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [targetKeyword, setTargetKeyword] = useState('');
    const [searchIntent, setSearchIntent] = useState('');
    const [secondaryKeywords, setSecondaryKeywords] = useState('');
    const [reviewedAt, setReviewedAt] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [ogImage, setOgImage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/pages/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                setPage(data);
                setSections(data.sections || {});
                setRichContent(data.richContent || '');
                setExcerpt(data.excerpt || '');
                setTargetKeyword(data.targetKeyword || '');
                setSearchIntent(data.searchIntent || '');
                setSecondaryKeywords(Array.isArray(data.secondaryKeywords) ? data.secondaryKeywords.join(', ') : '');
                setReviewedAt(formatDateTimeLocal(data.reviewedAt));
                setSeoTitle(data.seoTitle || '');
                setSeoDescription(data.seoDescription || '');
                setOgImage(data.ogImage || '');
                setLoading(false);
            })
            .catch(() => {
                toast.error('找不到此頁面');
                router.push('/admin/pages');
            });
    }, [slug, router]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const body: any = {
                excerpt,
                targetKeyword,
                searchIntent,
                secondaryKeywords,
                reviewedAt,
                seoTitle,
                seoDescription,
                ogImage,
            };
            if (page.pageType === 'richtext') {
                body.richContent = richContent;
            } else {
                body.sections = sections;
            }

            const res = await fetch(`/api/pages/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Save failed');
            const updated = await res.json();
            setPage(updated);
            toast.success('儲存成功！前台頁面已更新');
        } catch {
            toast.error('儲存失敗');
        } finally {
            setSaving(false);
        }
    }, [slug, page, sections, richContent, excerpt, targetKeyword, searchIntent, secondaryKeywords, reviewedAt, seoTitle, seoDescription, ogImage]);

    const handleSeoChange = (field: string, value: string) => {
        if (field === 'excerpt') setExcerpt(value);
        if (field === 'targetKeyword') setTargetKeyword(value);
        if (field === 'searchIntent') setSearchIntent(value);
        if (field === 'secondaryKeywords') setSecondaryKeywords(value);
        if (field === 'seoTitle') setSeoTitle(value);
        if (field === 'seoDescription') setSeoDescription(value);
        if (field === 'ogImage') setOgImage(value);
        if (field === 'reviewedAt') setReviewedAt(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-efan-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => router.push('/admin/pages')} className="text-sm text-gray-500 hover:text-efan-primary mb-1 flex items-center gap-1">
                        ← 返回列表
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">編輯：{page?.title}</h1>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 bg-efan-primary text-white rounded-xl font-semibold hover:bg-efan-primary/90 disabled:opacity-50 transition-all shadow-sm">
                    {saving ? '儲存中...' : '💾 儲存'}
                </button>
            </div>

            <div className="space-y-4">
                {page?.pageType === 'home' && <HomeEditor sections={sections} onChange={setSections} />}
                {page?.pageType === 'service' && <ServiceEditor sections={sections} onChange={setSections} />}
                {page?.pageType === 'contact' && <ContactEditor sections={sections} onChange={setSections} />}
                {page?.pageType === 'richtext' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">頁面內容</label>
                        <RichEditor content={richContent} onChange={setRichContent} placeholder="開始編輯頁面內容..." />
                    </div>
                )}

                <ContentMetadataSection
                    value={{
                        excerpt,
                        targetKeyword,
                        searchIntent,
                        secondaryKeywords,
                        reviewedAt,
                        seoTitle,
                        seoDescription,
                        ogImage,
                    }}
                    onChange={handleSeoChange}
                    searchIntentOptions={GUIDE_SEARCH_INTENTS}
                    enabledFields={{
                        excerpt: true,
                        targetKeyword: true,
                        searchIntent: true,
                        secondaryKeywords: true,
                        reviewedAt: true,
                        ogImage: true,
                    }}
                />
            </div>

            {/* Floating save button on mobile */}
            <div className="fixed bottom-6 right-6 md:hidden">
                <button onClick={handleSave} disabled={saving}
                    className="px-5 py-3 bg-efan-primary text-white rounded-full font-semibold shadow-lg hover:bg-efan-primary/90 disabled:opacity-50">
                    {saving ? '...' : '💾'}
                </button>
            </div>
        </div>
    );
}
