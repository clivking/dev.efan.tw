import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPage } from '@/lib/page-content';
import { getRequestSiteContext } from '@/lib/site-url';
import { NOTABLE_CLIENTS } from '@/lib/constants';
import { buildAboutPageSchema, buildBreadcrumbSchema } from '@/lib/structured-data';
import PageBanner from '@/components/common/PageBanner';
import ClientLogos from '@/components/home/ClientLogos';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const page = await getPage('about');
    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();

    return buildContentMetadata({
        site,
        pathname: '/about',
        title: page?.seoTitle || `關於一帆｜${company.yearsInBusiness}年安防整合專業｜${company.name}`,
        description:
            page?.seoDescription ||
            page?.excerpt ||
            `${company.name} 自民國 73 年起深耕安防產業，累積 ${company.yearsInBusiness} 年經驗，服務超過 ${company.clientCount} 家企業與場域。`,
        siteName: company.name,
        ogImage: page?.ogImage,
        type: 'article',
    });

/*    return {
        title: page?.seoTitle || `關於我們 | 創立於民國73年，深耕弱電工程超過${company.yearsInBusiness}年`,
        description: page?.seoDescription || `一帆安全整合創立於民國 73 年，深耕台北弱電工程超過 ${company.yearsInBusiness} 年。超過 ${company.clientCount} 家企業客戶選擇一帆，因為我們做事穩、施工細、出了問題有人處理。`,
        alternates: { canonical: `${baseUrl}/about` },
        openGraph: {
            title: page?.seoTitle || `關於${company.name}`,
            description: page?.seoDescription || company.tagline,
            url: `${baseUrl}/about`,
            type: 'article',
            locale: 'zh_TW',
            siteName: company.name,
            ...(page?.ogImage ? { images: [{ url: page.ogImage, width: 1200, height: 630 }] } : {}),
        },
    }; */
}

export default async function AboutPage() {
    const company = await getCompanyInfo();
    const page = await getPage('about');
    const site = await getRequestSiteContext();
    const baseUrl = site.origin;


    // NOTE: Structured layout below always takes precedence, rich content from CMS is not used for About page.

    // AboutPage + BreadcrumbList schema
    const aboutSchema = buildAboutPageSchema({
        url: `${baseUrl}/about`,
        name: `關於${company.name}`,
        organizationId: `${baseUrl}/#organization`,
    });

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: '首頁', item: baseUrl },
        { name: '關於我們', item: `${baseUrl}/about` },
    ]);

    // ==================== Main structured layout ====================
    const REASONS = [
        {
            num: '1',
            title: '負責的人，就是做事的人',
            desc: '一帆從場勘、規劃、施工到驗收，都重視同一件事：前面怎麼答應，現場就怎麼做到。',
        },
        {
            num: '2',
            title: '重視施工品質，也重視完工後的感受',
            desc: '設備有沒有裝正、線路有沒有整理、線槽有沒有收乾淨，這些細節客戶每天都看得到。我們不做「能用就好」的工程。',
        },
        {
            num: '3',
            title: '一個窗口整合，不被廠商互相推責任',
            desc: '門禁、監視、總機、考勤、網路，很多問題不是單一設備，而是整合後才會出現。一帆提供整體規劃與處理。',
        },
        {
            num: '4',
            title: '做完不是結束，讓客戶安心才是',
            desc: '很多客戶用了多年，後續有問題還是第一個想到找一帆。我們重視整段使用過程，不是只負責安裝那一天。',
        },
    ];

    const PROCESS_STEPS = [
        { step: '1', title: '需求諮詢', desc: '先了解你的場域、使用情境與真正需求，不急著推產品，先把方向談清楚。' },
        { step: '2', title: '現場場勘', desc: '實際到現場確認出入口、距離、配線方式、設備位置與使用動線，避免紙上談兵。' },
        { step: '3', title: '規劃與報價', desc: '依照現場條件提出合適方案，報價內容清楚，讓你知道每一筆預算花在哪裡。' },
        { step: '4', title: '專業施工', desc: '依規劃進場安裝，重視設備水平、配線整齊、標示清楚與整體完成度。' },
        { step: '5', title: '完工測試與驗收', desc: '不是裝完就算了，現場逐項確認功能正常、操作清楚，讓你真正能用。' },
        { step: '6', title: '後續維護支援', desc: '保固內依約處理；如有維護、擴充、調整需求，也找得到人協助。' },
    ];

    return (
        <div className="flex flex-col w-full bg-slate-50 min-h-screen relative overflow-hidden">
            <JsonLdScript data={aboutSchema} />
            <JsonLdScript data={breadcrumbSchema} />

            {/* 動態背景光暈 */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-900/5 via-emerald-900/5 to-transparent rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-900/5 via-indigo-900/5 to-transparent rounded-full blur-[100px] -z-10 -translate-x-1/3 -translate-y-1/3"></div>

            {/* ===== 1. Hero Banner ===== */}
            <PageBanner
                title="關於一帆安全整合"
                subtitle="做工程，我們知道客戶要的從來不只是價格，而是專業負責的規劃、細心嚴謹的施工，以及長期穩定的專人維護。"
            />

            {/* ===== 2. 信任數字 ===== */}
            {/* ===== 2. 信任數字 ===== */}
            <section className="py-16 relative z-10 -mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 backdrop-blur-xl">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center divide-x-0 lg:divide-x divide-slate-100">
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
                                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 mb-2">{company.yearsInBusiness}+</div>
                                <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">年深耕弱電整合產業</div>
                            </div>
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                                <div className="text-4xl md:text-5xl font-black text-slate-800 mb-2">{company.clientCount.toLocaleString()}+</div>
                                <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">家企業客戶信賴選擇</div>
                            </div>
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                                <div className="text-4xl md:text-5xl font-black text-amber-500 mb-2">5.0 ⭐</div>
                                <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">Google 真實客戶評價</div>
                            </div>
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                                <div className="text-4xl md:text-5xl font-black text-slate-800 mb-2">5 大</div>
                                <div className="text-slate-400 font-bold text-sm tracking-widest uppercase">門禁｜監視｜總機｜考勤｜網路</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 3. 我們的故事 — 兩代人的堅持 ===== */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* 左 — 文字 */}
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 border-l-8 border-emerald-500 pl-6 tracking-tight">
                                我們是怎麼走到今天的
                            </h2>
                            <p className="text-slate-400 font-bold mb-8 text-lg md:text-xl tracking-wide">兩代人的堅持，不是說故事，是做工程的方式</p>
                            <div className="space-y-6 text-slate-600 font-medium leading-loose text-lg">
                                <p>
                                    民國 73 年，父親創立一帆，從電話總機起家，一間一間跑、一條一條拉線，把口碑做起來。
                                    那個年代沒有廣告投放，靠的就是一件事：
                                    <span className="text-slate-900 font-black">「用心裝好，負責到底，客戶有事永遠找得到人。」</span>
                                </p>
                                <p>
                                    四十多年過去，技術從電話總機演進到雲端門禁系統、AI 監視錄影、生物考勤管理。
                                    我們做的項目越來越龐大，但有一件事從來沒變：<span className="text-emerald-600 font-bold">做完工程不是結束；讓客戶安心，才算真正完工。</span>
                                </p>
                                <p>
                                    現在由我接手經營，我把上一代的紮實施工精神，結合世界級的系統規劃與數位安防標準。
                                    你可以把一帆理解成一種最俐落的合作方式：<span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded inline-block">找對人負責，一次做好，後面系統營運沒煩惱。</span>
                                </p>
                            </div>
                        </div>

                        {/* 右 — 施工照片 */}
                        <div className="space-y-4">
                            <div className="aspect-[4/3] bg-gray-100 rounded-3xl relative overflow-hidden border-4 border-gray-50 shadow-2xl">
                                <Image
                                    src="/images/portfolio/spirit-level-installation.webp"
                                    alt="一帆安全整合使用水平尺確保設備安裝精準"
                                    width={800}
                                    height={600}
                                    loading="lazy"
                                    quality={70}
                                    className="w-full h-full object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                    <div className="text-white font-bold text-sm">施工使用水平尺，確保每個設備精準到位</div>
                                </div>
                            </div>
                            <div className="aspect-[4/3] bg-gray-100 rounded-3xl relative overflow-hidden border-4 border-gray-50 shadow-2xl">
                                <Image
                                    src="/images/portfolio/milwaukee-tools-construction.webp"
                                    alt="使用美國品牌美沃奇 Milwaukee 專業工具進行施工"
                                    width={800}
                                    height={600}
                                    loading="lazy"
                                    quality={70}
                                    className="w-full h-full object-cover object-bottom"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                                    <div className="text-white font-bold text-sm">使用美國品牌美沃奇專業工具施工</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== 4. 為什麼客戶會選擇一帆 ===== */}
            <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                            為什麼指標客戶都選擇<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">一帆？</span>
                        </h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-slate-400 text-lg md:text-xl font-medium">不是因為我們最會行銷，而是因為我們做完的系統真的很穩</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {REASONS.map((r, idx) => (
                            <div key={r.num} className="group bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl group-hover:bg-emerald-500/40 transition-colors duration-500"></div>
                                <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-900 shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform group-hover:scale-110 transition-transform duration-500">
                                        {r.num}
                                    </div>
                                    <div className="mt-1">
                                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{r.title}</h3>
                                        <p className="text-slate-400 leading-relaxed font-medium">{r.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 5. 曾服務客戶名單 (無限輪播) ===== */}
            <div className="py-4 bg-gray-50 border-t border-gray-100">
                <ClientLogos 
                    company={company} 
                    title="客戶信任，不分產業規模"
                    subtitle="從政府、學校、國防，到連鎖品牌與國際組織"
                />
            </div>

            {/* ===== 5.5 實績案例 ===== */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-efan-primary mb-4">實績案例，用作品說話</h2>
                        <p className="text-gray-500 text-lg font-medium">我們不只說做得好，讓你自己看</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { src: '/images/portfolio/taipei-101-immersive-exhibition.webp', alt: '台北101大樓雙融域沉浸式展廳弱電工程', client: '台北101大樓', project: '雙融域沉浸式展廳' },
                            { src: '/images/portfolio/feiteng-cloud-network-cabinet.webp', alt: '飛騰雲端弱電箱機櫃規劃整線', client: '飛騰雲端', project: '弱電箱機櫃規劃整線' },
                            { src: '/images/portfolio/weshaire-ai-face-recognition.webp', alt: 'WeShaire AI臉部辨識門禁系統安裝', client: 'WeShaire', project: 'AI 臉部辨識門禁系統' },
                            { src: '/images/portfolio/hongxi-design-fingerprint-access.webp', alt: '宏璽設計公司指紋辨識門禁系統', client: '宏璽設計公司', project: '指紋辨識門禁系統' },
                        ].map((item) => (
                            <div key={item.src} className="group relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                                <Image
                                    src={item.src}
                                    alt={item.alt}
                                    width={600}
                                    height={800}
                                    quality={70}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <div className="text-efan-accent font-bold text-sm mb-1">{item.client}</div>
                                    <div className="text-white font-black text-lg leading-tight">{item.project}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 6. 服務流程 — 6 步驟 ===== */}
            <section className="py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">打造完美弱電工程的 6 個階段</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-slate-500 text-lg md:text-xl font-medium">從第一通電話到完工後支援，每一步都清晰透明、絕不馬虎</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {PROCESS_STEPS.map((s, idx) => (
                            <div key={s.step} className="group bg-white hover:bg-slate-50 border border-slate-100 hover:border-emerald-200 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.1)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden backdrop-blur-3xl">
                                <div className="absolute top-0 right-0 text-9xl font-black text-slate-900/[0.02] -z-10 transform translate-x-4 -translate-y-4 group-hover:text-emerald-500/[0.05] transition-colors duration-500">
                                    0{s.step}
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-2xl mb-8 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-teal-400 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                                    {s.step}
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-emerald-700 transition-colors">{s.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 7. 我們相信的事 ===== */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-8">
                        <svg className="w-16 h-16 text-efan-accent mx-auto opacity-20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-efan-primary mb-8">我們相信的事</h2>
                    <div className="space-y-4 text-lg md:text-xl text-gray-600 font-medium leading-relaxed mb-10">
                        <p>設備，要選穩定的。</p>
                        <p>施工，要做紮實的。</p>
                        <p>規劃，要站在客戶使用的角度。</p>
                        <p>服務，要讓客戶有事找得到人。</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm max-w-2xl mx-auto">
                        <p className="text-lg text-gray-600 font-medium leading-relaxed italic">
                            你不一定要記得我們說過什麼。<br />
                            但你會記得一件事：<span className="text-efan-primary font-bold">系統裝好之後，事情真的少很多。</span>
                        </p>
                        <p className="mt-4 text-gray-500 font-medium">
                            這就是一帆一直想做到的。<br />
                            不是把設備交出去而已，而是把安心交給客戶。
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== 8. CTA 收尾 ===== */}
            <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900 -z-10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 tracking-tight drop-shadow-md">您的企業級系統基礎，<br className="hidden md:block"/>可以放心交給<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">一帆團隊。</span></h2>
                    <p className="text-slate-300 mb-12 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
                        不論你是新辦公室落成、企業廠區整改、還是面臨舊機故障風險，交給 40 年實績認證的工程團隊。我們會為您評估最穩健、最一勞永逸的企業級數位對策。
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                        <Link 
                            href="/quote-request" 
                            className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 px-10 py-5 rounded-full font-black text-xl hover:-translate-y-1 transition-all shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_45px_rgba(16,185,129,0.5)] active:scale-95"
                        >
                            免費獲取您的工程規劃報價
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <a 
                            href={`tel:${company.phone}`} 
                            className="inline-flex items-center justify-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md text-white px-10 py-5 rounded-full font-black text-xl hover:bg-white/10 hover:-translate-y-1 transition-all shadow-lg"
                        >
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {company.phone}
                        </a>
                    </div>
                    
                    <div className="inline-flex gap-8 text-slate-400 text-sm font-bold tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {company.address}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            週一至週五 09:00 - 18:00
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
