import Image from 'next/image';
import Link from 'next/link';

interface ProductTableProps {
    products: any[];
    onDelete: (id: string) => void;
    onReorder?: (items: { id: string; sortOrder: number }[]) => void;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string) => void;
    onSelectAll?: () => void;
}

export default function ProductTable({ products, onDelete, onReorder, selectedIds, onToggleSelect, onSelectAll }: ProductTableProps) {
    if (!products.length) {
        return (
            <div className="bg-white rounded-[32px] p-24 text-center border border-gray-100 shadow-sm animate-in zoom-in duration-500">
                <div className="text-6xl mb-6">📦</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2 tracking-tight">目前還沒有產品</h3>
                <p className="text-gray-400 font-bold mb-8">先建立第一筆產品資料，之後就能在這裡管理分類、排序、庫存與前台上架狀態。</p>
                <Link
                    href="/admin/products/new"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-efan-primary text-white font-black hover:bg-efan-primary-dark transition-all shadow-xl shadow-efan-primary/25"
                >
                    新增第一個產品
                </Link>
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        const row = (e.target as HTMLElement).closest('tr');
        if (row) row.style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const row = (e.target as HTMLElement).closest('tr');
        if (row) row.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const row = (e.target as HTMLElement).closest('tr');
        if (row) row.classList.add('bg-efan-primary/10');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const row = (e.target as HTMLElement).closest('tr');
        if (row) row.classList.remove('bg-efan-primary/10');
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const row = (e.target as HTMLElement).closest('tr');
        if (row) row.classList.remove('bg-efan-primary/10');

        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex === dropIndex || isNaN(dragIndex)) return;

        const reordered = [...products];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(dropIndex, 0, moved);

        const items = reordered.map((p: any, i: number) => ({ id: p.id, sortOrder: i }));
        if (onReorder) onReorder(items);
    };

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {onReorder && (
                                <th className="px-2 py-6 w-10 text-center text-sm font-black text-gray-300">排序</th>
                            )}
                            {onToggleSelect && (
                                <th className="px-4 py-6 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds?.size === products.length && products.length > 0}
                                        onChange={onSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-efan-primary focus:ring-efan-primary cursor-pointer"
                                    />
                                </th>
                            )}
                            <th className="px-8 py-6 text-sm font-black text-gray-400 tracking-wider">產品</th>
                            <th className="px-8 py-6 text-sm font-black text-gray-400 tracking-wider">分類 / 型態</th>
                            <th className="px-4 py-6 text-sm font-black text-gray-400 tracking-wider text-center">前台</th>
                            <th className="px-8 py-6 text-sm font-black text-gray-400 tracking-wider">庫存狀態</th>
                            <th className="px-8 py-6 text-sm font-black text-gray-400 tracking-wider">售價 / 成本</th>
                            <th className="px-8 py-6 text-sm font-black text-gray-400 tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {products.map((product: any, index: number) => (
                            <tr
                                key={product.id}
                                className={`group hover:bg-efan-primary/5 transition-all ${selectedIds?.has(product.id) ? 'bg-efan-primary/10' : ''}`}
                                draggable={!!onReorder}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                {onReorder && (
                                    <td className="px-2 py-6 text-center cursor-grab active:cursor-grabbing">
                                        <span className="text-gray-300 hover:text-gray-500 text-lg select-none">⋮⋮</span>
                                    </td>
                                )}
                                {onToggleSelect && (
                                    <td className="px-4 py-6">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds?.has(product.id) || false}
                                            onChange={() => onToggleSelect(product.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-efan-primary focus:ring-efan-primary cursor-pointer"
                                        />
                                    </td>
                                )}
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform overflow-hidden shadow-inner">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="h-full w-full object-cover" />
                                            ) : (
                                                product.type === 'bundle' ? '📦' : '🔌'
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg font-black text-gray-800 leading-tight">
                                                    {product.name}
                                                </span>
                                                {product.isHiddenItem && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                                        隱藏
                                                    </span>
                                                )}
                                                {product.isAI && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-[10px] font-black rounded-full">
                                                        AI
                                                    </span>
                                                )}
                                                {product.isHot && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black rounded-full">
                                                        熱門
                                                    </span>
                                                )}
                                                {product.isNew && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[10px] font-black rounded-full">
                                                        新品
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {product.brand && (
                                                    <span className="px-2 py-1 bg-efan-primary/10 text-efan-primary text-xs font-black rounded-lg">
                                                        {product.brand}
                                                    </span>
                                                )}
                                                <span className="text-sm font-bold text-gray-400">
                                                    {product.model || (product.type === 'bundle' ? '套餐組合' : '基本款式')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
                                            <span className="text-xs">📁</span>
                                            <span className="text-xs font-black text-gray-700">{product.category?.name || '未分類'}</span>
                                        </div>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit font-black text-[10px] tracking-widest uppercase shadow-sm ${product.type === 'bundle'
                                            ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                            : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                            }`}>
                                            {product.type === 'bundle' ? '📦 Bundle 套餐' : '🔌 Single 單品'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-6 text-center">
                                    {product.showOnWebsite ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg" title="已顯示在前台">🟢</span>
                                            {product.seoSlug && (
                                                <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate max-w-[100px]">
                                                    /{product.seoSlug}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-200 text-[10px] font-black uppercase tracking-widest">未上架</span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    {product.type === 'bundle' ? (
                                        <div className="text-gray-300 text-[10px] font-black tracking-widest uppercase">套餐不追蹤庫存</div>
                                    ) : !product.trackInventory ? (
                                        <div className="text-gray-300 text-[10px] font-black tracking-widest uppercase">未啟用庫存追蹤</div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xl font-black ${(Number(product.currentStock) || 0) <= (Number(product.lowStockThreshold) || 0) ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {Number(product.currentStock) || 0}
                                                </span>
                                                <span className="text-gray-400 text-xs font-bold">{product.unit || '件'}</span>
                                            </div>
                                            {(Number(product.currentStock) || 0) <= (Number(product.lowStockThreshold) || 0) && (
                                                <div className="px-2 py-1 bg-red-100/50 text-red-600 text-[10px] font-black rounded-lg w-fit border border-red-200 animate-pulse">
                                                    庫存偏低，請補貨（門檻：{Number(product.lowStockThreshold) || 0}）
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-efan-primary tracking-tighter">
                                            $ {(Number(product.sellingPrice) || 0).toLocaleString()}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400">
                                            成本: $ {(Number(product.costPrice) || 0).toLocaleString()}
                                            {product.unit ? ` / ${product.unit}` : ''}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="p-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-efan-primary hover:text-white hover:border-efan-primary transition-all shadow-sm"
                                        >
                                            編輯
                                        </Link>
                                        <button
                                            onClick={() => {
                                                if (confirm('確定要刪除這個產品嗎？')) {
                                                    onDelete(product.id);
                                                }
                                            }}
                                            className="p-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
