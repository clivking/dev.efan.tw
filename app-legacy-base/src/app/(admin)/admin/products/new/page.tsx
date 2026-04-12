'use client';

import ProductForm from '@/components/admin/ProductForm';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';

export default function NewProductPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-4xl font-black text-efan-primary tracking-tight mb-3 uppercase">{ADMIN_PRODUCT_COPY.newPage.title}</h1>
                    <p className="text-gray-400 font-bold tracking-tight">{ADMIN_PRODUCT_COPY.newPage.description}</p>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 shadow-inner">
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Admin / Products / New</span>
                </div>
            </div>

            <ProductForm />
        </div>
    );
}
