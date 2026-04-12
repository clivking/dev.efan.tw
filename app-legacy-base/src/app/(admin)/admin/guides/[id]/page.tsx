'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import GuideEditorForm from '@/components/admin/GuideEditorForm';

type GuideDetail = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  content: string;
  contentGroup: string;
  contentType: string;
  topic: string | null;
  targetKeyword: string | null;
  searchIntent: string | null;
  secondaryKeywords: unknown;
  faq: unknown;
  authorName: string | null;
  reviewedAt: string | null;
  relatedServiceSlugs: unknown;
  relatedProductSlugs: unknown;
  legacyPath: string | null;
  redirectStatus: string;
  targetGuideSlug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return '';

  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toCommaList(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function toJsonText(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : '';
}

export default function EditGuidePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guides/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Guide not found');
        }

        return response.json();
      })
      .then((data) => {
        setGuide(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('找不到文章');
        router.push('/admin/pages');
      });
  }, [id, router]);

  if (loading || !guide) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-efan-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button type="button" onClick={() => router.push('/admin/pages')} className="text-sm text-gray-500 hover:text-efan-primary">
          返回頁面管理
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{guide.title}</h1>
      </div>

      <GuideEditorForm
        initialData={{
          ...guide,
          excerpt: guide.excerpt || '',
          coverImage: guide.coverImage || '',
          topic: guide.topic || '',
          targetKeyword: guide.targetKeyword || '',
          searchIntent: guide.searchIntent || '',
          secondaryKeywords: toCommaList(guide.secondaryKeywords),
          faq: toJsonText(guide.faq),
          authorName: guide.authorName || '',
          reviewedAt: toDateTimeLocal(guide.reviewedAt),
          relatedServiceSlugs: toCommaList(guide.relatedServiceSlugs),
          relatedProductSlugs: toCommaList(guide.relatedProductSlugs),
          legacyPath: guide.legacyPath || '',
          targetGuideSlug: guide.targetGuideSlug || '',
          seoTitle: guide.seoTitle || '',
          seoDescription: guide.seoDescription || '',
          publishedAt: toDateTimeLocal(guide.publishedAt),
        }}
        onSubmit={async (data) => {
          const response = await fetch(`/api/guides/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            toast.error('儲存失敗');
            return;
          }

          toast.success('已更新文章');
        }}
      />
    </div>
  );
}
