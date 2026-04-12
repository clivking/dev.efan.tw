'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
}

const VIEW_LABEL = String.fromCodePoint(0x653e, 0x5927, 0x67e5, 0x770b);
const VIEWER_LABEL = String.fromCodePoint(0x7522, 0x54c1, 0x5716, 0x7247, 0x67e5, 0x770b, 0x5668);
const CLOSE_VIEWER_LABEL = String.fromCodePoint(0x95dc, 0x9589, 0x5716, 0x7247, 0x67e5, 0x770b, 0x5668);
const PREV_LABEL = String.fromCodePoint(0x4e0a, 0x4e00, 0x5f35, 0x5716, 0x7247);
const NEXT_LABEL = String.fromCodePoint(0x4e0b, 0x4e00, 0x5f35, 0x5716, 0x7247);
const DOT_LABEL_PREFIX = String.fromCodePoint(0x5207, 0x63db, 0x5230, 0x7b2c);
const DOT_LABEL_SUFFIX = String.fromCodePoint(0x5f35, 0x5716, 0x7247);

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const activeImage = images[activeIndex] || null;

    const handlePrev = useCallback(() => {
        setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
    }, [images.length]);

    const handleNext = useCallback(() => {
        setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
    }, [images.length]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') setLightboxOpen(false);
            if (event.key === 'ArrowLeft') handlePrev();
            if (event.key === 'ArrowRight') handleNext();
        },
        [handleNext, handlePrev],
    );

    return (
        <>
            <div>
                <div className="group relative aspect-square cursor-zoom-in" onClick={() => activeImage && setLightboxOpen(true)}>
                    {activeImage ? (
                        <>
                            <div className="pointer-events-none absolute inset-x-[16%] bottom-[4%] h-10 rounded-full bg-slate-950/35 blur-3xl" />
                            <Image
                                src={activeImage}
                                alt={productName}
                                fill
                                sizes="(min-width: 1024px) 42vw, 100vw"
                                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_28px_36px_rgba(15,23,42,0.26)] transition-transform duration-500 group-hover:scale-[1.03]"
                                priority
                            />
                            <div className="absolute bottom-0 right-0 flex items-center gap-2 text-sm font-bold text-white/82 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                    />
                                </svg>
                                {VIEW_LABEL}
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/28">
                            <svg className="h-32 w-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    )}

                    {images.length > 1 ? (
                        <>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handlePrev();
                                }}
                                className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/14 text-white/90 transition-all duration-300 hover:bg-white/24"
                                aria-label={PREV_LABEL}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleNext();
                                }}
                                className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/14 text-white/90 transition-all duration-300 hover:bg-white/24"
                                aria-label={NEXT_LABEL}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    ) : null}
                </div>

                {images.length > 1 ? (
                    <div className="mt-5 flex items-center justify-center gap-2 py-1">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                aria-label={`${DOT_LABEL_PREFIX} ${index + 1} ${DOT_LABEL_SUFFIX}`}
                                className={`h-2.5 rounded-full transition-all duration-200 ${
                                    index === activeIndex ? 'w-8 bg-white shadow-[0_0_20px_rgba(255,255,255,0.35)]' : 'w-2.5 bg-white/35 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {lightboxOpen && activeImage ? (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setLightboxOpen(false)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="dialog"
                    aria-modal="true"
                    aria-label={VIEWER_LABEL}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
                        aria-label={CLOSE_VIEWER_LABEL}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative h-[94vh] w-[98vw]" onClick={(event) => event.stopPropagation()}>
                        <Image src={activeImage} alt={productName} fill sizes="98vw" className="h-full w-full object-contain" priority />
                    </div>

                    {images.length > 1 ? (
                        <>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handlePrev();
                                }}
                                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 md:left-8"
                                aria-label={PREV_LABEL}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleNext();
                                }}
                                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 md:right-8"
                                aria-label={NEXT_LABEL}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    ) : null}

                    {images.length > 1 ? (
                        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/38 px-4 py-2 backdrop-blur-sm">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveIndex(index);
                                    }}
                                    aria-label={`${DOT_LABEL_PREFIX} ${index + 1} ${DOT_LABEL_SUFFIX}`}
                                    className={`h-2.5 rounded-full transition-all duration-200 ${
                                        index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                                    }`}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}
