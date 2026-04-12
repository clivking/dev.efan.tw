'use client';

import React, { useState, useEffect } from 'react';

interface TOCProps {
    headings: {
        id: string;
        label: string;
    }[];
}

// A dynamic table of contents that generates sitelinks for Google 
export default function StickyTOC({ headings }: TOCProps) {
    const [activeId, setActiveId] = useState<string>('');

    // Intersection Observer to highlight active heading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px' }
        );

        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        const yOffset = -100; // offset for sticky header
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    return (
        <nav className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 rounded-[28px] border border-gray-100 shadow-xl shadow-gray-200/50 sticky top-24">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-efan-primary">
                <span className="w-8 h-8 rounded-full bg-efan-accent/10 flex items-center justify-center text-efan-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                </span>
                文章目錄 (快速導覽)
            </h3>
            <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-gray-100">
                {headings.map(({ id, label }) => {
                    const isActive = activeId === id;
                    return (
                        <li key={id} className="relative z-10 pl-6">
                            <span className={`absolute left-1.5 top-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-efan-accent scale-150' : 'bg-gray-300'}`} />
                            <a
                                href={`#${id}`}
                                onClick={(e) => handleClick(e, id)}
                                className={`block font-medium text-sm leading-relaxed transition-colors duration-300 ${isActive ? 'text-efan-accent font-bold' : 'text-gray-500 hover:text-efan-primary-light'}`}
                            >
                                {label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
