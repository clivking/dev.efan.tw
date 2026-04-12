export default function FAQSection({ faqItems }: { faqItems: any[] }) {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-black text-center text-efan-primary mb-16 underline decoration-efan-accent decoration-8 underline-offset-[12px]">
          常見問題
        </h2>
        <div className="space-y-4">
          {faqItems.map((item, id) => (
            <details
              key={id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                <span className="font-bold text-lg text-efan-primary-dark pr-4">Q: {item.name}</span>
                <span className="text-efan-accent transition-transform group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" width="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <div className="p-6 pt-0 text-gray-600 leading-relaxed font-medium border-t border-gray-50 bg-gray-50/30">
                {item.acceptedAnswer.text}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
