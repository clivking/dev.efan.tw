import Link from 'next/link';
import { BreadcrumbItem } from '@/lib/breadcrumbs';

type BreadcrumbTrailProps = {
    items: BreadcrumbItem[];
    tone?: 'dark' | 'light';
    className?: string;
};

export default function BreadcrumbTrail({ items, tone = 'dark', className = '' }: BreadcrumbTrailProps) {
    if (!items.length) return null;

    const palette =
        tone === 'dark'
            ? {
                  shell: 'border-white/10 bg-white/5 text-slate-200 backdrop-blur-md shadow-2xl',
                  link: 'text-slate-300 hover:text-white',
                  current: 'text-white',
                  divider: 'text-white/30',
              }
            : {
                  shell: 'border-slate-200 bg-white text-slate-500 shadow-sm',
                  link: 'text-slate-500 hover:text-slate-900',
                  current: 'text-slate-900',
                  divider: 'text-slate-300',
              };

    return (
        <nav
            aria-label="Breadcrumb"
            className={`inline-flex max-w-full flex-wrap items-center rounded-full border px-5 py-2 text-xs font-medium tracking-wide sm:text-sm ${palette.shell} ${className}`.trim()}
        >
            {items.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center">
                    {index > 0 ? <span className={`mx-2 ${palette.divider}`}>/</span> : null}
                    {crumb.href ? (
                        <Link href={crumb.href} className={`transition-all duration-300 ${palette.link}`}>
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className={palette.current}>{crumb.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
