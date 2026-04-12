import Link from 'next/link';

export default function SEOCard() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link
            href="/solutions/taipei-office-access-control"
            className="group block relative overflow-hidden rounded-[32px] bg-white shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 isolate cursor-pointer h-full"
          >
            <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-efan-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-efan-accent/20 transition-colors duration-500" />
            <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-efan-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-8 xl:p-10 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start xl:items-center justify-between gap-8 h-full">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-red-100 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-700 animate-pulse" />
                    熱門方案
                  </span>
                  <span className="text-gray-600 font-bold text-sm">| 台北門禁整合</span>
                </div>
                <h3 className="text-2xl font-black text-efan-primary mb-4 group-hover:text-efan-accent transition-colors leading-snug">
                  台北辦公室門禁方案
                  <br />
                  快速看懂怎麼選
                </h3>
                <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
                  從公司規模、出入口數量到辨識方式，快速了解企業門禁規劃重點與預算方向。
                </p>
              </div>
              <div className="shrink-0 self-end sm:self-center lg:self-end xl:self-center mt-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-efan-primary to-efan-primary-light flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/solutions/taipei-cctv-system"
            className="group block relative overflow-hidden rounded-[32px] bg-white shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 isolate cursor-pointer h-full"
          >
            <div className="hidden md:block absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />
            <div className="hidden md:block absolute -top-24 -left-24 w-64 h-64 bg-slate-800/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-8 xl:p-10 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start xl:items-center justify-between gap-8 h-full">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-blue-100 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    NDAA 可規劃
                  </span>
                  <span className="text-gray-600 font-bold text-sm">| 監視系統建議</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors leading-snug">
                  工廠與辦公室監視系統
                  <br />
                  該怎麼規劃比較穩
                </h3>
                <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
                  從攝影機、錄影主機、儲存與 UPS，到遠端查看與後續維護需求，整理成易懂方案。
                </p>
              </div>
              <div className="shrink-0 self-end sm:self-center lg:self-end xl:self-center mt-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
