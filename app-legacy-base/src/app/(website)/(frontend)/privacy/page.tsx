import { Metadata } from 'next';
import { getCompanyInfo } from '@/lib/company';
import { getRequestSiteContext } from '@/lib/site-url';

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyInfo();
  const site = await getRequestSiteContext();
  const title = `隱私權政策 | ${company.name}`;
  const description = `了解 ${company.name} 如何蒐集、使用與保護網站與聯絡表單中的個人資料，以及你的資料權利與聯繫方式。`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${site.origin}/privacy`,
    },
    openGraph: {
      title,
      description,
      url: `${site.origin}/privacy`,
      type: 'website',
      locale: 'zh_TW',
      siteName: company.name,
    },
  };
}

export default async function PrivacyPolicyPage() {
  const company = await getCompanyInfo();

  return (
    <div className="bg-gray-50 min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-efan-primary to-blue-900 px-8 py-12 text-center text-white">
            <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">隱私權政策</h1>
            <p className="text-blue-100 font-medium">說明本站蒐集、處理與保護個人資料的方式。</p>
          </div>

          <article className="px-8 py-12 md:px-12 prose prose-blue prose-headings:text-efan-primary prose-a:text-efan-accent max-w-none text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-400 font-medium mb-8">最後更新日期：2026 年 4 月 5 日</p>

            <p>
              {company.name} 重視你的個人資料與隱私安全。本政策說明我們在你使用網站、填寫表單、
              洽詢服務或下載資料時，可能蒐集的資訊種類、用途與保護方式。
            </p>

            <h2>蒐集的資訊</h2>
            <p>我們可能蒐集你主動提供的姓名、公司名稱、聯絡電話、電子郵件、需求內容，以及網站使用過程中的基礎技術紀錄。</p>

            <h2>使用目的</h2>
            <p>蒐集到的資料將用於回覆詢問、提供報價與技術服務、改善網站體驗、維護系統安全，以及與既有案件相關的後續聯繫。</p>

            <h2>資料保護</h2>
            <p>我們會採取合理的管理與技術措施，降低未經授權存取、洩漏、竄改或遺失的風險，並僅在必要範圍內由授權人員接觸資料。</p>

            <h2>第三方服務</h2>
            <p>本站可能使用分析、地圖或表單等第三方服務。這些服務若涉及資料處理，將依其服務條款與隱私政策執行。</p>

            <h2>你的權利</h2>
            <p>你可以依個資法相關規定，向我們查詢、閱覽、請求更正、停止使用或刪除你的個人資料；若有需求，可透過下方聯繫方式與我們聯絡。</p>

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
