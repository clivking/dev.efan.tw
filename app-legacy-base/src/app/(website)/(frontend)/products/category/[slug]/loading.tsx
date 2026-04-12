export default function CategoryLoading() {
    return (
        <div className="flex flex-col w-full">
            {/* Hero skeleton */}
            <section className="bg-efan-primary text-white py-16 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-4 w-48 bg-white/10 rounded mb-4 animate-pulse" />
                    <div className="h-10 w-80 bg-white/10 rounded mb-4 animate-pulse" />
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                </div>
            </section>

            {/* Content skeleton */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar skeleton */}
                        <aside className="lg:w-64 flex-shrink-0 space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </aside>

                        {/* Product grid skeleton */}
                        <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="h-48 bg-gray-100 animate-pulse" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
                                            <div className="h-4 w-1/2 bg-gray-50 rounded animate-pulse" />
                                            <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
