'use client';

import {
  SEO_DESCRIPTION_SOFT_LIMIT,
  DEFAULT_OG_IMAGE_PATH,
  countSeoDescriptionCharacters,
  type SharedContentMetadata,
  type SharedContentMetadataChangeHandler,
} from '@/lib/content-metadata';

type SearchIntentOption = {
  value: string;
  label: string;
};

type Props = {
  value: SharedContentMetadata;
  onChange: SharedContentMetadataChangeHandler;
  searchIntentOptions?: readonly SearchIntentOption[];
  enabledFields?: Partial<Record<keyof SharedContentMetadata, boolean>>;
};

const defaultEnabledFields: Record<keyof SharedContentMetadata, boolean> = {
  excerpt: false,
  targetKeyword: false,
  searchIntent: false,
  secondaryKeywords: false,
  reviewedAt: false,
  seoTitle: true,
  seoDescription: true,
  ogImage: true,
};

const inputClassName =
  'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-efan-primary focus:outline-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function ContentMetadataSection({
  value,
  onChange,
  searchIntentOptions = [],
  enabledFields,
}: Props) {
  const fields = { ...defaultEnabledFields, ...enabledFields };
  const seoDescriptionCount = countSeoDescriptionCharacters(value.seoDescription);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">內容 Metadata</h2>
        <p className="text-sm text-gray-500">統一管理摘要、關鍵字與 SEO 欄位，讓 Page 與 Guide 維持同一套內容 contract。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.excerpt ? (
          <div className="md:col-span-2">
            <Field label="摘要" hint="用於卡片摘要、摘要段落與 AI overview 的高密度內容來源。">
              <textarea
                value={value.excerpt || ''}
                onChange={(event) => onChange('excerpt', event.target.value)}
                rows={3}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}

        {fields.targetKeyword ? (
          <Field label="目標關鍵字">
            <input
              type="text"
              value={value.targetKeyword || ''}
              onChange={(event) => onChange('targetKeyword', event.target.value)}
              className={inputClassName}
            />
          </Field>
        ) : null}

        {fields.searchIntent ? (
          <Field label="搜尋意圖">
            <select
              value={value.searchIntent || ''}
              onChange={(event) => onChange('searchIntent', event.target.value)}
              className={inputClassName}
            >
              {searchIntentOptions.map((item) => (
                <option key={item.value || 'unset'} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {fields.secondaryKeywords ? (
          <div className="md:col-span-2">
            <Field label="次要關鍵字" hint="以逗號分隔，供內文延伸詞、FAQ 與內部連結策略使用。">
              <input
                type="text"
                value={value.secondaryKeywords || ''}
                onChange={(event) => onChange('secondaryKeywords', event.target.value)}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}

        {fields.reviewedAt ? (
          <Field label="最後審閱時間">
            <input
              type="datetime-local"
              value={value.reviewedAt || ''}
              onChange={(event) => onChange('reviewedAt', event.target.value)}
              className={inputClassName}
            />
          </Field>
        ) : null}

        {fields.seoTitle ? (
          <div className="md:col-span-2">
            <Field label="SEO Title">
              <input
                type="text"
                value={value.seoTitle}
                onChange={(event) => onChange('seoTitle', event.target.value)}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}

        {fields.seoDescription ? (
          <div className="md:col-span-2">
            <Field
              label="SEO Description"
              hint={`目前 ${seoDescriptionCount} 字，建議控制在 ${SEO_DESCRIPTION_SOFT_LIMIT} 字內。`}
            >
              <textarea
                value={value.seoDescription}
                onChange={(event) => onChange('seoDescription', event.target.value)}
                rows={3}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}

        {fields.ogImage ? (
          <div className="md:col-span-2">
            <Field label="OG 圖片">
              <input
                type="text"
                value={value.ogImage || ''}
                onChange={(event) => onChange('ogImage', event.target.value)}
                className={inputClassName}
                placeholder={DEFAULT_OG_IMAGE_PATH}
              />
            </Field>
          </div>
        ) : null}
      </div>
    </section>
  );
}
