import Link from 'next/link';
import { CompanyInfo } from '@/lib/company';

export default function CTABanner({ company }: { company: CompanyInfo }) {
  return (
    <section className="py-20 bg-efan-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
          你的系統，可以交給<br className="hidden md:block" />更讓人放心的團隊
        </h2>
        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          不論你是新案規劃、舊系統更新、設備擴充，或是遇到系統常出狀況，都可以先跟我們談談。<br className="hidden md:block" />
          我們會先幫你判斷：怎麼做比較穩、比較適合、後續比較省事。
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Link
            href="/quote-request"
            className="bg-efan-accent text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-efan-accent-light transition-all shadow-xl active:scale-95 w-full sm:w-auto"
          >
            立即取得免費諮詢
          </Link>
          <div className="text-2xl font-black text-white">
            或撥打專線：<a href={`tel:${company.phone}`} className="hover:underline text-efan-accent">{company.phone}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
