import Image from 'next/image';

const CRAFTSMANSHIP_ITEMS = [
  {
    src: '/images/portfolio/milwaukee-tools-construction.webp',
    alt: '專業施工工具與現場整線',
    caption: '現場整線與施工品質',
    hero: true,
    objectPos: 'object-bottom',
  },
  {
    src: '/images/portfolio/anodized-lock-precision-cut.webp',
    alt: '門禁設備精準開孔施工',
    caption: '精準開孔與收邊',
  },
  {
    src: '/images/portfolio/flush-mount-card-reader.webp',
    alt: '埋入式讀卡機安裝',
    caption: '埋入式讀卡機',
  },
  {
    src: '/images/portfolio/infrared-sensor-door-opener.webp',
    alt: '感應開門系統施工',
    caption: '感應開門整合',
  },
  {
    src: '/images/portfolio/spirit-level-installation.webp',
    alt: '水平校正與安裝細節',
    caption: '施工細節與校正',
  },
];

export default function CraftsmanshipGallery() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-efan-primary mb-4">施工細節，看得見</h2>
          <div className="w-20 h-1.5 bg-efan-accent mx-auto mb-6 rounded-full" />
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            從設備定位、管線整理到完工收邊，每一步都影響後續使用體驗與維護效率。
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[220px] md:auto-rows-[260px]">
          {CRAFTSMANSHIP_ITEMS.map((item) => (
            <div
              key={item.src}
              className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ${item.hero ? 'col-span-2 row-span-2' : ''}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={item.hero ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
                className={`object-cover group-hover:scale-105 transition-transform duration-700 ${item.objectPos || ''}`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className={`font-bold leading-tight ${item.hero ? 'text-base' : 'text-sm'}`}>{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
