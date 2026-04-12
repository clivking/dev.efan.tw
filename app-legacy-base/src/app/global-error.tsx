'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hant-TW">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">系統暫時發生錯誤</h1>
            <p className="mb-6 text-sm leading-7 text-gray-600">
              很抱歉，目前頁面暫時無法載入。請稍後再試，或重新整理頁面。
            </p>
            {process.env.NODE_ENV === 'development' && error?.message && (
              <pre className="mb-6 overflow-x-auto rounded-2xl bg-red-50 p-4 text-left text-xs leading-6 text-red-700">
                {error.message}
              </pre>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-full bg-[#f58220] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              重新整理
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
