import { NOTABLE_CLIENTS } from '@/lib/constants';
import { CompanyInfo } from '@/lib/company';

export default function ClientLogos({
  company,
  title,
  subtitle,
}: {
  company: CompanyInfo;
  title?: string;
  subtitle?: string;
}) {
  const marqueeItems = [...NOTABLE_CLIENTS, ...NOTABLE_CLIENTS];

  return (
    <section className="bg-gray-50 py-16 border-b border-gray-100 overflow-hidden select-none">
      <style>{`
        @keyframes infiniteMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: infiniteMarquee 40s linear infinite;
        }
        @media (hover: hover) and (pointer: fine) {
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        {title ? (
          <>
            <h2 className="text-3xl font-black text-efan-primary mb-2 md:mb-4">{title}</h2>
            {subtitle && <p className="text-gray-500 font-medium text-lg">{subtitle}</p>}
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 tracking-[0.2em] bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            40年來服務超過 {company.clientCount.toLocaleString()} 家企業與場域
          </p>
        )}
      </div>

      <div className="relative w-full overflow-hidden flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-64 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-12 md:gap-24 px-12 md:px-24" aria-hidden="true">
          {marqueeItems.map((client, i) => (
            <div
              key={`${client}-${i}`}
              className="flex-shrink-0 text-xl md:text-2xl font-black text-gray-500 hover:text-efan-primary transition-all duration-[400ms] cursor-default transform hover:scale-110"
            >
              {client}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
