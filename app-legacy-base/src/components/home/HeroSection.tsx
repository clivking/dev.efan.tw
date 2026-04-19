import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cctv, Fingerprint } from 'lucide-react';
import { CompanyInfo } from '@/lib/company';

const HERO_HIGHLIGHTS = [
  {
    icon: Fingerprint,
    title: '門禁與考勤整合',
    desc: '刷卡、指紋、人臉辨識與出勤管理一次到位',
  },
  {
    icon: Cctv,
    title: '監視與 AI 偵測',
    desc: '高畫質影像、遠端查看與異常事件通知',
  },
];

export default function HeroSection({ company }: { company: CompanyInfo }) {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-24 pb-20 overflow-hidden bg-[#020816] text-white">
      {/* CSS dot-grid texture — replaces hero.webp (eliminates LCP image) */}
      <div className="absolute inset-0 z-0 opacity-[0.07] bg-[radial-gradient(circle,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#020816] lg:from-[#020816]/95 via-[#020816]/82 to-transparent" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#020816] via-transparent to-transparent" />
      <div className="hidden lg:block absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-[100%] bg-blue-500/10 blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-8 md:mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold text-xs sm:text-sm mb-8 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              在地深耕 {company.yearsInBusiness} 年，超過 {company.clientCount.toLocaleString()} 家企業採用
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-black mb-6 leading-[1.15] tracking-tight relative z-20">
              <span className="block mb-2 drop-shadow-xl">台北門禁系統、監視錄影、電話總機整合</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-efan-accent to-amber-300 drop-shadow-sm">
                規劃施工更要穩定、好管、可持續維運
              </span>
            </h1>

            <p className="text-[17px] sm:text-xl text-gray-300 mb-10 leading-relaxed font-medium max-w-2xl bg-white/5 p-4 rounded-r-xl border-l-4 border-efan-accent md:backdrop-blur-sm relative z-20">
              我們提供大台北企業與商用空間的門禁系統、監視錄影、電話總機與弱電整合規劃，
              從現場評估、設備選型到施工交付與後續維護，協助你把安全、管理與日常營運一次整理到位。
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link
                href="/products/inquiry"
                className="group bg-gradient-to-r from-efan-accent to-efan-accent-dark hover:from-efan-accent-light hover:to-efan-accent text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(232,121,43,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                立即提出需求
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#services"
                className="group bg-white/5 hover:bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center backdrop-blur-md active:scale-95 text-center"
              >
                查看服務內容
              </Link>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 perspective-1000 relative">
            <div className="transition-all duration-700 translate-y-0 opacity-100">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-efan-accent to-amber-500 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">安全整合規劃</h3>
                    <p className="text-sm text-gray-400">Security Integration</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {HERO_HIGHLIGHTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                        <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-white font-bold">{item.title}</div>
                          <div className="text-gray-400 text-sm">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                    <span>System Status</span>
                    <span className="text-emerald-400 font-bold">READY</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 w-full rounded-full" />
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl">
                <div className="text-amber-400 font-black text-xl">5.0 評價</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl md:backdrop-blur-sm hover:bg-white/10 transition-colors text-center sm:text-left shadow-lg">
            <div className="text-xl md:text-3xl font-black text-efan-accent mb-1">{company.yearsInBusiness} 年</div>
            <div className="text-xs md:text-sm text-gray-400 font-medium whitespace-nowrap">專業整合經驗</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl md:backdrop-blur-sm hover:bg-white/10 transition-colors text-center sm:text-left shadow-lg">
            <div className="text-xl md:text-3xl font-black text-efan-accent mb-1">{company.clientCount.toLocaleString()}+</div>
            <div className="text-xs md:text-sm text-gray-400 font-medium whitespace-nowrap">企業與場域服務</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl md:backdrop-blur-sm hover:bg-white/10 transition-colors text-center sm:text-left shadow-lg">
            <div className="text-xl md:text-3xl font-black text-efan-accent mb-1">5.0</div>
            <div className="text-xs md:text-sm text-gray-400 font-medium whitespace-nowrap">Google 評價</div>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl md:backdrop-blur-sm hover:bg-white/10 transition-colors text-center sm:text-left shadow-lg">
            <div className="text-xl md:text-3xl font-black text-efan-accent mb-1">NDAA</div>
            <div className="text-xs md:text-sm text-gray-400 font-medium whitespace-nowrap">方案可延伸規劃</div>
          </div>
        </div>
      </div>
    </section>
  );
}
