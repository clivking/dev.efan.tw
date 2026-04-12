import { Metadata } from 'next';
import { getCompanyInfo } from '@/lib/company';
import { getRequestSiteContext } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyInfo();
  const site = await getRequestSiteContext();
  const title = `服務條款 | ${company.name}`;
  const description = `查看 ${company.name} 網站服務條款、報價與聯繫使用規範，了解本站資訊提供方式與雙方權利義務。`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${site.origin}/terms`,
    },
    openGraph: {
      title,
      description,
      url: `${site.origin}/terms`,
      type: 'website',
      locale: 'zh_TW',
      siteName: company.name,
    },
  };
}

export default async function TermsOfServicePage() {
  const company = await getCompanyInfo();

  return (
    <div className="bg-gray-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-12 text-center text-white">
            <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">服務條款</h1>
            <p className="text-slate-300 font-medium">說明本站內容、詢價與聯繫使用的基本規範。</p>
          </div>

          <article className="px-8 py-12 md:px-12 prose prose-slate prose-headings:text-slate-800 prose-a:text-efan-accent max-w-none text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-400 font-medium mb-8">最後更新日期：2026 年 4 月 5 日</p>

            <p>
              歡迎使用 {company.name} 網站。當你瀏覽本站、下載資料、提交詢價或聯絡表單時，
              即表示你已閱讀並同意本服務條款。
            </p>

            <h2>網站資訊</h2>
            <p>本站內容以提供產品、系統整合、服務說明與聯繫資訊為主。我們會盡力維持資訊正確，但不保證所有內容在任何時間點都完整或最新。</p>

            <h2>詢價與專案內容</h2>
            <p>網站上的產品與服務資訊屬一般性介紹，實際規格、交期、安裝範圍、報價與保固內容，仍以雙方正式確認文件為準。</p>

            <h2>使用限制</h2>
            <p>你不得以任何違法、干擾系統、侵害他人權益或未經授權的方式使用本站，也不得擅自大量抓取、重製或散布本站內容。</p>

            <h2>智慧財產權</h2>
            <p>本站文字、圖片、設計與其他內容，除另有標示外，均受相關智慧財產權保護。未經授權不得任意重製、改作或作為商業用途。</p>

            <h2>責任限制</h2>
            <p>因網站維護、系統中斷、第三方服務異常或不可抗力因素所造成的損失，我們將在法律允許範圍內負合理責任。</p>

            <h2>聯絡方式</h2>
            <p>
              公司名稱：{company.name}
              <br />
              地址：{company.address}
              <br />
              電話：{company.phone}
              <br />
              Email：{company.email}
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
