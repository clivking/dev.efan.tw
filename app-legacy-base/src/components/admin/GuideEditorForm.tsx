'use client';

import { type ReactNode, useState } from 'react';
import ContentMetadataSection from '@/components/admin/ContentMetadataSection';
import {
  GUIDE_CONTENT_GROUPS,
  GUIDE_CONTENT_TYPES,
  GUIDE_REDIRECT_STATUSES,
  GUIDE_SEARCH_INTENTS,
} from '@/lib/guide-schema';

type FaqItem = {
  question: string;
  answer: string;
};

export type GuideFormData = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  content: string;
  contentGroup: string;
  contentType: string;
  topic: string;
  targetKeyword: string;
  searchIntent: string;
  secondaryKeywords: string;
  faq: string;
  authorName: string;
  reviewedAt: string;
  relatedServiceSlugs: string;
  relatedProductSlugs: string;
  legacyPath: string;
  redirectStatus: string;
  targetGuideSlug: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  publishedAt: string;
  sortOrder: number;
};

type Props = {
  initialData?: Partial<GuideFormData>;
  submitLabel?: string;
  onSubmit: (data: GuideFormData) => Promise<void>;
};

const defaultData: GuideFormData = {
  slug: '',
  title: '',
  excerpt: '',
  coverImage: '',
  content: '',
  contentGroup: 'guide',
  contentType: 'guide',
  topic: '',
  targetKeyword: '',
  searchIntent: '',
  secondaryKeywords: '',
  faq: '',
  authorName: '',
  reviewedAt: '',
  relatedServiceSlugs: '',
  relatedProductSlugs: '',
  legacyPath: '',
  redirectStatus: 'none',
  targetGuideSlug: '',
  seoTitle: '',
  seoDescription: '',
  isPublished: false,
  publishedAt: '',
  sortOrder: 0,
};

function parseFaq(value: string): FaqItem[] {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        question: typeof item?.question === 'string' ? item.question : '',
        answer: typeof item?.answer === 'string' ? item.answer : '',
      }))
      .filter((item) => item.question.trim() || item.answer.trim());
  } catch {
    return [];
  }
}

function stringifyFaq(items: FaqItem[]) {
  const normalized = items.filter((item) => item.question.trim() || item.answer.trim());
  return normalized.length ? JSON.stringify(normalized, null, 2) : '';
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function FaqEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const items = parseFaq(value);

  const updateItems = (nextItems: FaqItem[]) => {
    onChange(stringifyFaq(nextItems));
  };

  const updateItem = (index: number, key: keyof FaqItem, fieldValue: string) => {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], [key]: fieldValue };
    updateItems(nextItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${index}-${item.question}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">FAQ {index + 1}</div>
            <button
              type="button"
              onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}
              className="text-sm font-semibold text-red-500 hover:text-red-600"
            >
              刪除
            </button>
          </div>

          <div className="space-y-3">
            <Field label="問題">
              <input
                type="text"
                value={item.question}
                onChange={(event) => updateItem(index, 'question', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-efan-primary focus:outline-none"
              />
            </Field>

            <Field label="答案">
              <textarea
                value={item.answer}
                onChange={(event) => updateItem(index, 'answer', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-efan-primary focus:outline-none"
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => updateItems([...items, { question: '', answer: '' }])}
        className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-efan-primary hover:text-efan-primary"
      >
        新增 FAQ
      </button>
    </div>
  );
}

export default function GuideEditorForm({ initialData, submitLabel = '儲存', onSubmit }: Props) {
  const [form, setForm] = useState<GuideFormData>({ ...defaultData, ...initialData });
  const [saving, setSaving] = useState(false);
  const [contentView, setContentView] = useState<'source' | 'preview'>('source');

  const inputClassName = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-efan-primary focus:outline-none';

  const updateField = <K extends keyof GuideFormData>(key: K, value: GuideFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="標題">
              <input type="text" value={form.title} onChange={(event) => updateField('title', event.target.value)} className={inputClassName} />
            </Field>
          </div>

          <Field label="Slug">
            <input type="text" value={form.slug} onChange={(event) => updateField('slug', event.target.value)} className={inputClassName} />
          </Field>

          <Field label="排序">
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateField('sortOrder', Number(event.target.value) || 0)}
              className={inputClassName}
            />
          </Field>

          <Field label="內容群組">
            <select value={form.contentGroup} onChange={(event) => updateField('contentGroup', event.target.value)} className={inputClassName}>
              {GUIDE_CONTENT_GROUPS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="內容型別">
            <select value={form.contentType} onChange={(event) => updateField('contentType', event.target.value)} className={inputClassName}>
              {GUIDE_CONTENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="主題">
            <input type="text" value={form.topic} onChange={(event) => updateField('topic', event.target.value)} className={inputClassName} />
          </Field>

          <Field label="作者">
            <input type="text" value={form.authorName} onChange={(event) => updateField('authorName', event.target.value)} className={inputClassName} />
          </Field>

          <Field label="發布時間">
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => updateField('publishedAt', event.target.value)}
              className={inputClassName}
            />
          </Field>

          <div className="flex items-center gap-3 pt-6">
            <input
              id="guide-published"
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateField('isPublished', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
            />
            <label htmlFor="guide-published" className="text-sm font-medium text-gray-700">
              已發布
            </label>
          </div>

          <div className="md:col-span-2">
            <Field label="封面 / OG 圖片路徑">
              <input
                type="text"
                value={form.coverImage}
                onChange={(event) => updateField('coverImage', event.target.value)}
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="相關服務 Slugs" hint="以逗號分隔">
              <input
                type="text"
                value={form.relatedServiceSlugs}
                onChange={(event) => updateField('relatedServiceSlugs', event.target.value)}
                className={inputClassName}
                placeholder="access-control, phone-system"
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="相關產品 Slugs" hint="以逗號分隔">
              <input
                type="text"
                value={form.relatedProductSlugs}
                onChange={(event) => updateField('relatedProductSlugs', event.target.value)}
                className={inputClassName}
                placeholder="akuvox-r25a, soyal-ar-837-e"
              />
            </Field>
          </div>

          <Field label="舊路徑">
            <input
              type="text"
              value={form.legacyPath}
              onChange={(event) => updateField('legacyPath', event.target.value)}
              className={inputClassName}
              placeholder="/blog/example-guide"
            />
          </Field>

          <Field label="Redirect 狀態">
            <select value={form.redirectStatus} onChange={(event) => updateField('redirectStatus', event.target.value)} className={inputClassName}>
              {GUIDE_REDIRECT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="目標 Guide Slug">
            <input
              type="text"
              value={form.targetGuideSlug}
              onChange={(event) => updateField('targetGuideSlug', event.target.value)}
              className={inputClassName}
            />
          </Field>
        </div>
      </section>

      <ContentMetadataSection
        value={{
          excerpt: form.excerpt,
          targetKeyword: form.targetKeyword,
          searchIntent: form.searchIntent,
          secondaryKeywords: form.secondaryKeywords,
          reviewedAt: form.reviewedAt,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          ogImage: form.coverImage,
        }}
        onChange={(field, value) => {
          if (field === 'ogImage') {
            updateField('coverImage', value);
            return;
          }

          updateField(field as keyof GuideFormData, value as never);
        }}
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

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{"\u5167\u6587"}</h2>
            <p className="text-sm text-gray-500">{"\u6307\u5357\u5167\u5bb9\u6539\u6210 source-first\u3002\u76f4\u63a5\u8cbc\u4e0a Codex \u7522\u51fa\u7684\u4e7e\u6de8 HTML\uff0c\u4e0d\u518d\u4f9d\u8cf4\u5bcc\u6587\u5b57\u7de8\u8f2f\u5668\u64cd\u4f5c\u3002"}</p>
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setContentView('source')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                contentView === 'source' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Source
            </button>
            <button
              type="button"
              onClick={() => setContentView('preview')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                contentView === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {contentView === 'source' ? (
          <div className="space-y-3">
            <textarea
              value={form.content}
              onChange={(event) => updateField('content', event.target.value)}
              rows={24}
              spellCheck={false}
              className="min-h-[460px] w-full rounded-2xl border border-gray-300 bg-slate-950 px-4 py-4 font-mono text-[13px] leading-6 text-slate-100 focus:border-efan-primary focus:outline-none"
              placeholder={"\u8cbc\u4e0a Codex \u7522\u51fa\u7684 HTML \u5167\u5bb9"}
            />
            <p className="text-xs leading-6 text-gray-500">
              {"\u8acb\u7dad\u6301\u8a9e\u610f\u5316 HTML\uff1a`p`\u3001`h2`\u3001`h3`\u3001`ul`\u3001`ol`\u3001`li`\u3001`blockquote`\u3001`a`\u3001`strong`\u3002\u4e0d\u8981\u5728\u9019\u88e1\u505a\u8996\u89ba\u6392\u7248\u3002"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-[#faf7f0] p-6">
            <div
              className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-950 prose-p:leading-8 prose-p:text-slate-700 prose-a:text-[#1d4ed8]"
              dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-gray-400">\u5c1a\u7121\u5167\u5bb9</p>' }}
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
          <p className="text-sm text-gray-500">FAQ 會同時影響前台可讀性、摘要能力與後續 schema 輸出。</p>
        </div>
        <FaqEditor value={form.faq} onChange={(value) => updateField('faq', value)} />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-efan-primary px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-efan-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '儲存中...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
