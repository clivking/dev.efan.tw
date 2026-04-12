'use client';

interface AdminPaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

/**
 * Generate page numbers array with ellipsis markers (-1).
 * Example: [1, -1, 4, 5, 6, -1, 10]
 */
function getPageNumbers(current: number, totalPages: number): number[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];

    // Always show first page
    pages.push(1);

    if (current > 3) {
        pages.push(-1); // ellipsis
    }

    // Middle range
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < totalPages - 2) {
        pages.push(-1); // ellipsis
    }

    // Always show last page
    pages.push(totalPages);

    return pages;
}

export default function AdminPagination({ page, pageSize, total, onPageChange }: AdminPaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    if (total === 0) return null;

    const pageNumbers = getPageNumbers(page, totalPages);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
            {/* Info */}
            <div className="text-sm font-bold text-gray-400 tracking-tight">
                顯示第 <span className="text-gray-600">{from}</span> ~ <span className="text-gray-600">{to}</span> 筆，共 <span className="text-gray-600">{total}</span> 筆
                {totalPages > 1 && (
                    <span className="ml-2 text-gray-300">
                        （第 {page} / {totalPages} 頁）
                    </span>
                )}
            </div>

            {/* Controls */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    {/* Previous */}
                    <button
                        disabled={page === 1}
                        onClick={() => onPageChange(page - 1)}
                        className="px-3 py-2 rounded-xl bg-white border border-gray-200 font-bold text-sm disabled:opacity-30 transition-all hover:bg-gray-50 hover:shadow-sm"
                        title="上一頁"
                    >
                        ‹ 上一頁
                    </button>

                    {/* Page Numbers */}
                    {pageNumbers.map((p, idx) =>
                        p === -1 ? (
                            <span key={`e${idx}`} className="px-2 py-2 text-gray-300 font-bold text-sm select-none">
                                ···
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`min-w-[40px] px-3 py-2 rounded-xl font-black text-sm transition-all ${
                                    p === page
                                        ? 'bg-efan-primary text-white shadow-lg shadow-efan-primary/25 scale-105'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    {/* Next */}
                    <button
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className="px-3 py-2 rounded-xl bg-white border border-gray-200 font-bold text-sm disabled:opacity-30 transition-all hover:bg-gray-50 hover:shadow-sm"
                        title="下一頁"
                    >
                        下一頁 ›
                    </button>
                </div>
            )}
        </div>
    );
}
