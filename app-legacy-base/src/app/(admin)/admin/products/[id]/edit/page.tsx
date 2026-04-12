'use client';

import { useState, useEffect, use } from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { toast } from 'sonner';
import { ADMIN_PRODUCT_COPY } from '@/lib/admin-product-copy';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.product) {
                    setInitialData(data.product);
                } else {
                    toast.error(ADMIN_PRODUCT_COPY.editPage.notFound);
                }
            })
            .catch((e) => {
                console.error(e);
                toast.error(ADMIN_PRODUCT_COPY.common.fetchError);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="py-48 flex flex-col items-center justify-center gap-6 animate-pulse">
                <div className="h-16 w-16 bg-efan-primary rounded-3xl animate-spin opacity-20"></div>
                <div className="text-xl font-black text-gray-400 tracking-widest uppercase">{ADMIN_PRODUCT_COPY.common.loading}</div>
            </div>
        );
    }

    if (!initialData) {
        return <div className="p-24 text-center font-bold text-gray-400">{ADMIN_PRODUCT_COPY.editPage.notFound}</div>;
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-4xl font-black text-efan-primary tracking-tight mb-3 uppercase">{ADMIN_PRODUCT_COPY.editPage.title}</h1>
                    <p className="text-gray-400 font-bold tracking-tight">{ADMIN_PRODUCT_COPY.editPage.description}</p>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 shadow-inner">
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">ID: {id?.substring(0, 8)}...</span>
                </div>
            </div>

            <ProductForm id={id} initialData={initialData} />
        </div>
    );
}
