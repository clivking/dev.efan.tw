import { Metadata } from 'next';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import PageBanner from '@/components/common/PageBanner';
import { getPage } from '@/lib/page-content';
import { Phone, Mail, MapPin } from 'lucide-react';
import ContactForm from './ContactForm';
import ServerStatusBadge from '@/components/common/ServerStatusBadge';
import { getRequestSiteContext } from '@/lib/site-url';
import { buildBreadcrumbSchema } from '@/lib/structured-data';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const page = await getPage('contact');
    const company = await getCompanyInfo();
    const site = await getRequestSiteContext();

    return buildContentMetadata({
        site,
        pathname: '/contact',
        title: page?.seoTitle || `聯絡我們｜${company.name}`,
        description:
            page?.seoDescription ||
            page?.excerpt ||
            `如果您需要專業、誠信的安全整合夥伴，歡迎與我們聯絡。${company.address}，電話 ${company.phone}。`,
        siteName: company.name,
        ogImage: page?.ogImage,
        type: 'website',
    });
}

export default async function ContactPage() {
    const company = await getCompanyInfo();
    const page = await getPage('contact');
    const sections = (page?.sections || {}) as any;

    // CMS data with fallbacks
    const heroTitle = sections.hero?.title || '聯絡我們';
    const heroSubtitle = sections.hero?.subtitle || `${company.address.split('區')[0]}區在地服務， ${company.yearsInBusiness} 年資深經驗，隨時為您待命。`;
    const businessHours = sections.businessHours || [
        { days: '週一至週五', hours: '09:00 - 18:00' },
        { days: '週六、週日與國定假日', hours: '公休' },
    ];
    const businessHoursNote = sections.businessHoursNote || '* 如需非營業時間之緊急維修，請聯繫各案場專任工程師之緊急對策窗口。';
    const formTitle = sections.formTitle || '線上諮詢';
    const formSubtitle = sections.formSubtitle || '感謝您的洽詢，我們通常會在一個工作天內與您聯繫。';

    const site = await getRequestSiteContext();
    const baseUrl = site.origin;
    const breadcrumbs = withHomeBreadcrumb('聯絡我們');
    const breadcrumbLd = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, baseUrl, '/contact'));

    return (
        <div className="flex flex-col w-full bg-slate-50 min-h-screen relative overflow-hidden">
            <JsonLdScript data={breadcrumbLd} />
            
            {/* 動態背景光暈 */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-900/10 via-emerald-900/5 to-transparent rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-900/10 via-indigo-900/5 to-transparent rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3"></div>

            <PageBanner title={heroTitle} subtitle={heroSubtitle} breadcrumbs={breadcrumbs} />

            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">隨時待命的專業技術服務</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full mb-6"></div>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">若您遇到緊急的系統異常，或有大型案場的規劃需求，一帆安全的工程團隊隨時準備為您提供支援與技術對策。</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

                        {/* Left: Contact Info (Bento Card Layout) */}
                        <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                            
                            {/* 聯絡資訊卡片區 */}
                            <div className="space-y-6">
                                <div className="group bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] relative overflow-hidden backdrop-blur-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white shrink-0 transform group-hover:rotate-12 transition-transform duration-300">
                                            <Phone className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">技術客服專線</div>
                                            <a href={`tel:${company.phone}`} className="text-2xl font-black text-slate-800 hover:text-emerald-600 transition-colors">
                                                {company.phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="group bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(59,130,246,0.1)] relative overflow-hidden backdrop-blur-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white shrink-0 transform group-hover:-rotate-12 transition-transform duration-300">
                                            <Mail className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">專案報價信箱</div>
                                            <a href={`mailto:${company.email}`} className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors truncate block">
                                                {company.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="group bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 hover:border-amber-200 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(245,158,11,0.1)] relative overflow-hidden backdrop-blur-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500"></div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 flex items-center justify-center text-white shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                                            <MapPin className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">台北營運總部</div>
                                            <div className="text-lg font-bold text-slate-800 leading-snug">{company.address}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 營業時間 Server Block */}
                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <h3 className="text-xl font-bold text-white tracking-widest">系統服務時段</h3>
                                    <ServerStatusBadge />
                                </div>
                                <ul className="space-y-4 relative z-10">
                                    {businessHours.map((bh: any, i: number) => (
                                        <li key={i} className={`flex justify-between items-center font-medium ${i < businessHours.length - 1 ? 'border-b border-white/10 pb-4' : 'pt-2'}`}>
                                            <span className="text-slate-300">{bh.days}</span>
                                            <span className={bh.hours === '公休' ? 'text-slate-500' : 'text-emerald-400 font-bold tracking-wide'}>{bh.hours}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400 leading-relaxed italic relative z-10">
                                    {businessHoursNote}
                                </div>
                            </div>
                        </div>

                        {/* Right: Contact Form (SaaS Elevated) */}
                        <div className="lg:col-span-3 lg:pl-4 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative">
                                {/* 裝飾點綴 */}
                                <div className="absolute top-12 right-12 text-slate-100 pointer-events-none">
                                    <Mail className="w-24 h-24" />
                                </div>
                                
                                <div className="relative z-10 mb-10">
                                    <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{formTitle}</h2>
                                    <p className="text-slate-500 font-medium">{formSubtitle}</p>
                                </div>
                                
                                <div className="relative z-10">
                                    <ContactForm />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 地圖區也是 Bento 圓角風格 */}
                    <div className="mt-20 lg:mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">台北總部地理樞紐</h2>
                            <p className="text-slate-500 font-medium">深耕大台北地區，以極速反應時間提供大安、信義商辦專屬弱電維護</p>
                        </div>
                        <div className="w-full h-[500px] bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 relative group">
                            <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none z-10"></div>
                            <iframe
                                title="Efan Office Location"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(company.address)}&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale-[30%] contrast-[1.1] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
