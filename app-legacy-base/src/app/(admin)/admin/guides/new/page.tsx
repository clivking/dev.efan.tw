'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import GuideEditorForm from '@/components/admin/GuideEditorForm';

export default function NewGuidePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <button type="button" onClick={() => router.push('/admin/pages')} className="text-sm text-gray-500 hover:text-efan-primary">
          返回頁面管理
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">新增知識指南</h1>
      </div>

      <GuideEditorForm
        submitLabel="建立文章"
        onSubmit={async (data) => {
          const response = await fetch('/api/guides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            toast.error('建立失敗');
            return;
          }

          const created = await response.json();
          toast.success('已建立文章');
          router.push(`/admin/guides/${created.id}`);
        }}
      />
    </div>
  );
}
