import Link from 'next/link';
import { KeyRound, Video, Phone, Clock, Plug, Calculator } from 'lucide-react';
import { SERVICES } from '@/lib/constants';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  KeyRound, Video, Phone, Clock, Plug,
};

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-efan-primary mb-4">服務內容總覽</h2>
        <div className="w-20 h-1.5 bg-efan-accent mx-auto mb-6 rounded-full" />
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          從門禁、監視、總機到弱電整合，依照企業場域需求提供規劃與施工。
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {SERVICES.map((s) => {
          const Icon = ICON_MAP[s.iconName];
          return (
            <Link
              key={s.id}
              href={s.href}
              className="group bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-efan-primary/5 border border-gray-100 hover:border-efan-primary/10 rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-efan-primary to-efan-primary-light flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-efan-primary/20 transition-all duration-300">
                {Icon ? (
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                ) : (
                  <span className="text-2xl text-white">{s.icon}</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-efan-primary-dark mb-3 group-hover:text-efan-accent transition-colors">
                {s.name}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                {s.shortDesc}
              </p>
              <div className="text-orange-700 font-bold text-sm flex items-center gap-2">
                了解更多 <span className="group-hover:translate-x-1 transition-transform">{'->'}</span>
              </div>
            </Link>
          );
        })}

        <Link
          href="/solutions/taipei-office-access-control#budget-estimator"
          className="group bg-gradient-to-br from-efan-primary to-efan-primary-light hover:shadow-2xl hover:shadow-efan-primary/20 rounded-3xl p-8 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
            <Calculator className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
            快速報價試算
          </h3>
          <p className="text-efan-accent-light text-sm leading-relaxed mb-6 font-medium">
            先用線上試算快速了解門禁方案與預算方向，再安排現場評估與正式報價。
          </p>
          <div className="text-white font-bold text-sm flex items-center gap-2">
            立即試算 <span className="group-hover:translate-x-1 transition-transform">{'->'}</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
