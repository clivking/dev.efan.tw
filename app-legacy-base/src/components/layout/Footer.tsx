import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { SERVICES } from '@/lib/constants';
import type { CompanyInfo } from '@/lib/company';
import { shouldBypassImageOptimization } from '@/lib/image-paths';

const GUIDE_FOOTER_LINKS = [
  { href: '/guides/access-control-system-pricing', label: '門禁系統價格怎麼算' },
  { href: '/guides/2026-access-control-tco-analysis', label: '2026 門禁 TCO 採購分析' },
  { href: '/guides/office-access-control-upgrade-guide', label: '辦公室門禁升級指引' },
  { href: '/guides/cloud-vs-onprem-pbx', label: '雲端與實體總機差異' },
];

const LOCATION_LINKS = [
  { href: '/locations/neihu-access-control', label: '內湖門禁規劃施工' },
  { href: '/locations/daan-access-control', label: '大安區辦公室門禁' },
  { href: '/locations/taipei-access-control', label: '台北門禁系統安裝' },
  { href: '/locations/taipei-pbx-system', label: '台北企業總機規劃' },
];

function getShortCompanyName(companyName: string) {
  return companyName.replace('安全整合有限公司', '').trim() || companyName;
}

export default function Footer({ company: companyProp }: { company?: CompanyInfo | null }) {
  const company = companyProp;

  if (!company) return null;

  const shortName = getShortCompanyName(company.name);

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-[#020816] pb-8 pt-24 text-white">
      <div className="pointer-events-none absolute top-0 left-1/4 hidden h-full w-1/2 bg-blue-500/5 blur-[120px] mix-blend-screen md:block" />
      <div className="pointer-events-none absolute right-0 bottom-0 hidden h-1/2 w-1/3 bg-efan-accent/5 blur-[100px] mix-blend-screen md:block" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.02] [background-size:30px_30px] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3 lg:pr-4">
            <div className="mb-8 inline-flex items-center">
              {company.pdfLogoUrl ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={company.pdfLogoUrl}
                    alt={company.name}
                    loading="lazy"
                    width={120}
                    height={32}
                    className="h-8 w-auto object-contain drop-shadow-lg"
                    unoptimized={shouldBypassImageOptimization(company.pdfLogoUrl)}
                  />
                  <span className="text-xl font-bold tracking-wide text-white">{company.name}</span>
                </div>
              ) : (
                <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-efan-accent to-amber-500 text-sm text-white shadow-lg shadow-efan-accent/30">
                    一帆
                  </span>
                  {company.name}
                </h3>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium text-gray-400">
              <div className="group flex items-start gap-4 transition-colors hover:text-white">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-efan-accent group-hover:text-amber-400" strokeWidth={2} />
                <span className="leading-relaxed">{company.address}</span>
              </div>
              <div className="group flex items-center gap-4 transition-colors hover:text-white">
                <Phone className="h-4 w-4 shrink-0 text-efan-accent group-hover:text-amber-400" strokeWidth={2} />
                <a href={`tel:${company.phone}`}>{company.phone}</a>
              </div>
              <div className="group flex items-center gap-4 transition-colors hover:text-white">
                <Mail className="h-4 w-4 shrink-0 text-efan-accent group-hover:text-amber-400" strokeWidth={2} />
                <a href={`mailto:${company.email}`}>{company.email}</a>
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/10 to-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  安防與弱電整合服務
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-wide text-white">
              <span className="h-5 w-1 rounded-full bg-efan-primary" />
              服務項目
            </h3>
            <ul className="space-y-3.5 text-sm font-medium text-gray-400">
              {SERVICES.map((service) => (
                <li key={service.id}>
                  <Link href={service.href} className="group flex items-center transition-colors hover:text-efan-accent">
                    <ArrowRight className="-ml-4 mr-2 h-3 w-3 opacity-0 text-efan-accent transition-all group-hover:ml-0 group-hover:opacity-100" />
                    <span>{service.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-wide text-white">
              <span className="h-5 w-1 rounded-full bg-efan-accent shadow-[0_0_10px_rgba(232,121,43,0.5)]" />
              知識指南
            </h3>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              {GUIDE_FOOTER_LINKS.map((item, index) => (
                <li key={item.href}>
                  <Link href={item.href} className="group block transition-colors hover:text-white">
                    {index === 0 && <div className="mb-1 text-xs font-bold text-efan-accent">HOT</div>}
                    <span className="border-b border-transparent transition-colors group-hover:border-efan-accent">{item.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides" className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-bold text-sky-200 transition hover:border-sky-300 hover:bg-sky-400/20 hover:text-white">
                  查看全部知識指南
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-wide text-white">
              <span className="h-5 w-1 rounded-full bg-teal-400" />
              台北工程服務
            </h3>
            <ul className="space-y-3.5 text-sm font-medium text-gray-400">
              {LOCATION_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center transition-colors hover:text-white">
                    <MapPin className="mr-2 h-3.5 w-3.5 text-gray-500 transition-colors group-hover:text-teal-400" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm lg:p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
                    <Phone className="h-4 w-4 text-blue-300" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-300/80">Business Hours</div>
                    <p className="mt-1 whitespace-nowrap text-[0.95rem] font-semibold text-white">週一至週五 09:00 - 18:00</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-center">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">Phone</div>
                  <a
                    href={`tel:${company.phone}`}
                    className="mt-2 block whitespace-nowrap text-[1.65rem] leading-none font-black tracking-[-0.03em] text-white transition-colors hover:text-efan-accent"
                  >
                    {company.phone}
                  </a>
                </div>

                <Link
                  href="/quote-request"
                  className="inline-flex w-full items-center justify-center rounded-full bg-efan-accent px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-efan-accent-dark"
                >
                  快速報價
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 pb-8 text-xs font-medium text-gray-500 md:flex-row">
          <p>
            Copyright © {company.foundedYear} - {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-4 md:mt-0 md:justify-end">
            <Link href="/privacy" className="transition-colors hover:text-gray-300">
              隱私權政策
            </Link>
            <span className="text-gray-700">|</span>
            <Link href="/terms" className="transition-colors hover:text-gray-300">
              服務條款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
