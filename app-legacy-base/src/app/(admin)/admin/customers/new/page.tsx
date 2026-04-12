import CustomerForm from '@/components/admin/CustomerForm';

export default function NewCustomerPage() {
    return (
        <div className="space-y-8">
            <div>
                <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-gray-400">客戶建立</div>
                <h1 className="text-3xl font-black text-efan-primary tracking-tight mb-2">新增客戶</h1>
                <p className="text-gray-500 font-medium">先建立公司、聯絡人與案場資料，後續報價與客戶入口就能直接沿用。</p>
            </div>

            <CustomerForm />
        </div>
    );
}
