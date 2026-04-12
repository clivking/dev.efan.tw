import { CompanyInfo } from '@/lib/company';
import { Hammer, Users, ShieldCheck, PhoneCall, Quote } from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: '單一窗口整合溝通',
    desc: '從需求訪談、設備規劃到現場施工與交付，減少跨廠商協調成本。',
  },
  {
    icon: Hammer,
    title: '重視施工品質與細節',
    desc: '線材整理、設備位置、管線收邊與實際操作動線，都是我們現場重點。',
  },
  {
    icon: ShieldCheck,
    title: '系統整合與後續可維護',
    desc: '不是只把設備裝上去，而是讓企業之後更好管理、擴充與維護。',
  },
  {
    icon: PhoneCall,
    title: '售後支援與現場服務',
    desc: '安裝完成後仍保留後續協助窗口，處理教育訓練、調整與問題排除。',
  },
];

export default function FeaturesSection({ company }: { company: CompanyInfo }) {
  const Icon0 = FEATURES[0].icon;
  const Icon1 = FEATURES[1].icon;
  const Icon2 = FEATURES[2].icon;
  const Icon3 = FEATURES[3].icon;

  return (
    <section className="py-24 bg-[#020816] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-blue-500/10 blur-[150px] pointer-events-none mix-blend-screen hidden md:block" />
      <div className="absolute bottom-0 left-0 w-1/3 h-[500px] bg-efan-accent/10 blur-[150px] pointer-events-none mix-blend-screen hidden md:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center md:text-left mb-16">
          <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight text-white">
            為什麼企業場域
            <br className="hidden lg:block" />
            會持續選擇 <span className="text-transparent bg-clip-text bg-gradient-to-r from-efan-accent to-amber-400">{company.name}</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl">
            我們不只交付設備，更重視整體方案是否穩定、好用，以及未來是否容易維護。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[auto]">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#12243d] to-[#0A182B] border border-white/10 rounded-3xl p-8 lg:p-12 relative overflow-hidden group hover:border-white/20 transition-all shadow-xl">
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-white pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Hammer className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-center">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-400/30">
                <Icon1 className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-black mb-4 text-white drop-shadow-sm">{FEATURES[1].title}</h3>
              <p className="text-gray-300 text-lg leading-relaxed max-w-lg">{FEATURES[1].desc}</p>
            </div>
          </div>

          <div className="lg:row-span-2 bg-gradient-to-b from-efan-accent to-[#D4651B] border border-efan-accent-light/20 rounded-3xl p-8 lg:p-12 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(232,121,43,0.3)] transition-all">
            <div className="absolute -top-10 -right-10 opacity-10 text-white pointer-events-none group-hover:-rotate-12 transition-transform duration-700">
              <ShieldCheck className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 text-white">
                <Icon2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-black mb-4 text-white drop-shadow-md">{FEATURES[2].title}</h3>
              <p className="text-white/90 text-[17px] leading-relaxed flex-grow">{FEATURES[2].desc}</p>
              <div className="mt-8 pt-8 border-t border-white/20 hidden lg:block">
                <div className="text-white/80 text-sm font-bold tracking-wider uppercase mb-2">Integrated Services</div>
                <div className="flex flex-wrap gap-2">
                  {['門禁', '監視', '考勤', '總機', '弱電'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/[0.07] transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-gray-300">
              <Icon0 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{FEATURES[0].title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{FEATURES[0].desc}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/[0.07] transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 text-emerald-400">
              <Icon3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{FEATURES[3].title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{FEATURES[3].desc}</p>
          </div>

          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/10 p-8 lg:p-10 rounded-3xl backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-shrink-0 text-white/20">
                <Quote className="w-16 h-16" />
              </div>
              <div className="flex-grow">
                <blockquote className="text-xl md:text-2xl font-bold italic mb-6 leading-relaxed text-gray-200">
                  我們希望客戶不是一次性安裝，而是真正得到一套能長期使用、方便管理、後續有人支援的系統。
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-efan-primary border border-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">一帆</div>
                  <div>
                    <div className="font-bold text-white tracking-wide">{company.name}</div>
                    <div className="text-efan-accent text-xs font-bold mt-0.5">專業整合團隊</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
