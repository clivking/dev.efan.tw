'use client';

import { useEffect, useMemo, useState } from 'react';

type GuideTocHeading = {
  id: string;
  text: string;
};

type GuideTocProps = {
  headings: GuideTocHeading[];
};

const HEADING_OFFSET = 180;

export default function GuideToc({ headings }: GuideTocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');

  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

  useEffect(() => {
    if (headingIds.length === 0) return;

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const syncActiveHeading = () => {
      const current = elements.findLast((element) => element.getBoundingClientRect().top <= HEADING_OFFSET);
      setActiveId(current?.id ?? elements[0].id);
    };

    syncActiveHeading();

    const observer = new IntersectionObserver(
      () => {
        syncActiveHeading();
      },
      {
        rootMargin: `-${HEADING_OFFSET}px 0px -55% 0px`,
        threshold: [0, 0.2, 0.6, 1],
      }
    );

    elements.forEach((element) => observer.observe(element));
    window.addEventListener('scroll', syncActiveHeading, { passive: true });
    window.addEventListener('resize', syncActiveHeading);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', syncActiveHeading);
      window.removeEventListener('resize', syncActiveHeading);
    };
  }, [headingIds]);

  if (headings.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5 shadow-sm lg:sticky lg:top-24">
      <div className="text-sm font-bold tracking-[0.18em] text-slate-400">ON THIS PAGE</div>
      <h2 className="mt-2 text-xl font-black text-slate-950">章節導航</h2>
      <details className="mt-4 lg:hidden">
        <summary className="cursor-pointer rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-900">展開本頁重點</summary>
        <div className="mt-3 space-y-2">
          {headings.map((heading, index) => {
            const isActive = heading.id === activeId;
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`block rounded-2xl px-4 py-3 text-base leading-7 transition ${
                  isActive ? 'bg-slate-950 text-white font-black shadow-sm' : 'text-slate-700 hover:bg-stone-50 hover:text-slate-950 font-bold'
                }`}
              >
                <span className={`mr-2 ${isActive ? 'text-white/70' : 'text-slate-300'}`}>{String(index + 1).padStart(2, '0')}</span>
                {heading.text}
              </a>
            );
          })}
        </div>
      </details>
      <div className="mt-4 hidden space-y-2 lg:block">
        {headings.map((heading, index) => {
          const isActive = heading.id === activeId;
          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={`group flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition ${
                isActive
                  ? 'border-slate-900 bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]'
                  : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-stone-50 hover:text-slate-950'
              }`}
            >
              <span
                className={`mt-0.5 text-[11px] font-black tracking-[0.16em] transition ${
                  isActive ? 'text-white/65' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className={`text-[15px] leading-7 text-balance transition ${isActive ? 'font-black' : 'font-bold'}`}>
                {heading.text}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
