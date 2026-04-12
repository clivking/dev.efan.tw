import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CustomerForm from '@/components/admin/CustomerForm';

export const dynamic = 'force-dynamic';

export default async function EditCustomerPage({ params }: { params: any }) {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            companyNames: true,
            contacts: true,
            locations: true,
        },
    });

    if (!customer) notFound();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-gray-400">客戶資料編輯</div>
                    <h1 className="mb-2 text-3xl font-black tracking-tight text-efan-primary">編輯客戶</h1>
                    <p className="font-medium text-gray-500">調整公司、聯絡人、案場與備註，讓詳情頁、報價與客戶入口維持一致。</p>
                </div>

                <Link
                    href={`/admin/customers/${customer.id}`}
                    className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50"
                >
                    返回客戶詳情
                </Link>
            </div>

            <CustomerForm initialData={customer} />
        </div>
    );
}
