import BreadcrumbTrail from '@/components/common/BreadcrumbTrail';
import { BreadcrumbItem } from '@/lib/breadcrumbs';

interface PageBannerProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export default function PageBanner({ title, subtitle, breadcrumbs }: PageBannerProps) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-efan-primary-dark via-efan-primary to-slate-900 text-white min-h-[320px] md:min-h-[360px] flex flex-col justify-center border-b border-white/5 shadow-2xl py-12 md:py-0">
            
            {/* Ambient Glowing Background Orbs (Aurora Effect) - Hidden on Mobile for Performance */}
            <div className="hidden md:block absolute -top-[20%] -left-[10%] w-[60%] h-[150%] rounded-[100%] bg-blue-500/15 blur-[120px] pointer-events-none transition-transform duration-1000 origin-center" />
            <div className="hidden md:block absolute top-[10%] -right-[10%] w-[50%] h-[120%] rounded-[100%] bg-efan-accent/10 blur-[100px] pointer-events-none mix-blend-screen transition-transform duration-1000 object-center" />
            
            {/* Tech Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none z-0 mix-blend-overlay" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center w-full">
                
                {/* Modern Pill-Shaped Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 ? <BreadcrumbTrail items={breadcrumbs} tone="dark" className="mb-8" /> : null}

                {/* Majestic Title & Subtitle */}
                <div className="w-full max-w-5xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black mb-6 tracking-tight leading-[1.2] text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-50 to-gray-400 drop-shadow-sm px-4">
                        {title}
                    </h1>
                    {subtitle && (
                        <div className="flex justify-center w-full">
                            <p className="text-base md:text-lg text-blue-100/90 font-medium leading-relaxed border-t-2 border-efan-accent pt-4 text-center shadow-sm w-max max-w-full px-4">
                                {subtitle}
                            </p>
                        </div>
                    )}
                </div>

            </div>
            
            {/* Bottom Fade Gradient for smooth transition to white sections */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent z-0 pointer-events-none" />
        </section>
    );
}
