'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  GUIDE_CONTENT_GROUP_LABELS,
  GUIDE_CONTENT_TYPE_LABELS,
  GUIDE_REDIRECT_STATUS_LABELS,
} from '@/lib/guide-schema';

type PageItem = {
  id: string;
  slug: string;
  title: string;
  pageType: string;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
};

type GuideItem = {
  id: string;
  slug: string;
  title: string;
  contentGroup: string;
  contentType: string;
  topic: string | null;
  legacyPath: string | null;
  redirectStatus: string;
  targetGuideSlug: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

type TabKey = 'pages' | 'guides';

const PAGE_TYPE_LABELS: Record<string, string> = {
  home: '首頁',
  service: '服務頁',
  richtext: '一般內容頁',
  contact: '聯絡頁',
};

function StatusPill({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">已發布</span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">草稿</span>
  );
}

function FragmentRows({ mainRow, extraRow }: { mainRow: ReactNode; extraRow?: ReactNode }) {
  return (
    <>
      {mainRow}
      {extraRow}
    </>
  );
}

export default function AdminPagesListPage() {
  const [tab, setTab] = useState<TabKey>('pages');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/pages').then((res) => res.json()), fetch('/api/guides').then((res) => res.json())])
      .then(([pagesData, guidesData]) => {
        setPages(pagesData);
        setGuides(guidesData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tabs = useMemo(
    () => [
      { key: 'pages' as const, label: '前台內容', count: pages.length + 1 },
      { key: 'guides' as const, label: '知識指南', count: guides.length },
    ],
    [guides.length, pages.length]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-efan-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">頁面管理</h1>
        <p className="mt-1 text-sm text-gray-500">固定前台頁面與知識指南共用同一個管理入口，避免左側選單膨脹。</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200">
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
                active ? 'border border-b-0 border-gray-200 bg-white text-efan-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {item.label}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{item.count}</span>
            </button>
          );
        })}
      </div>

      {tab === 'pages' ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">標題</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">頁型</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">狀態</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">更新時間</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {pages.map((page, index) => {
                const nextPage = pages[index + 1];
                const insertPortalRow = page.sortOrder <= 5 && (!nextPage || nextPage.sortOrder >= 6);

                return (
                  <FragmentRows
                    key={page.id}
                    mainRow={
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{page.title}</div>
                          <div className="font-mono text-xs text-gray-400">{page.slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            {PAGE_TYPE_LABELS[page.pageType] || page.pageType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill published={page.isPublished} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(page.updatedAt).toLocaleString('zh-TW')}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/pages/${page.slug}`} className="font-medium text-efan-primary hover:underline">
                            編輯
                          </Link>
                        </td>
                      </tr>
                    }
                    extraRow={
                      insertPortalRow ? (
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">教學專區</div>
                            <div className="font-mono text-xs text-gray-400">portal</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">技術支援內容</span>
                          </td>
                          <td className="px-6 py-4" />
                          <td className="px-6 py-4" />
                          <td className="px-6 py-4 text-right">
                            <Link href="/admin/portal" className="font-medium text-efan-primary hover:underline">
                              編輯
                            </Link>
                          </td>
                        </tr>
                      ) : null
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href="/admin/guides/new"
              className="rounded-xl bg-efan-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-efan-primary/90"
            >
              新增知識指南
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">標題</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">類型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">主題</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">更新時間</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {guides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{guide.title}</div>
                      <div className="font-mono text-xs text-gray-400">{guide.slug}</div>
                      {guide.legacyPath ? <div className="text-xs text-amber-600">{guide.legacyPath}</div> : null}
                      {guide.targetGuideSlug ? <div className="text-xs text-emerald-600">轉向: {guide.targetGuideSlug}</div> : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{GUIDE_CONTENT_TYPE_LABELS[guide.contentType] || guide.contentType}</div>
                      <div className="text-xs text-gray-400">{GUIDE_CONTENT_GROUP_LABELS[guide.contentGroup] || guide.contentGroup}</div>
                      <div className="text-xs text-gray-400">{GUIDE_REDIRECT_STATUS_LABELS[guide.redirectStatus] || guide.redirectStatus}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{guide.topic || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusPill published={guide.isPublished} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(guide.updatedAt).toLocaleString('zh-TW')}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/guides/${guide.id}`} className="font-medium text-efan-primary hover:underline">
                        編輯
                      </Link>
                    </td>
                  </tr>
                ))}

                {guides.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      目前還沒有知識指南資料。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
