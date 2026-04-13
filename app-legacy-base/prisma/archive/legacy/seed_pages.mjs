import { createPrismaClient } from './prisma-client.mjs';

const prisma = createPrismaClient();

async function main() {
    console.log('開始建立 CMS 頁面資料...');

    const pageSeedData = [
        {
            slug: 'home',
            title: '首頁',
            pageType: 'home',
            sortOrder: 0,
            seoTitle: '一帆安全整合｜門禁、監視、通訊與弱電整合規劃',
            seoDescription: '一帆安全整合提供門禁、監視、電話總機、考勤與弱電整合規劃，協助企業建立穩定、安全、易維護的系統架構。',
            sections: {
                hero: {
                    badge: '40 年安防整合經驗',
                    heading: '一帆安全整合\n門禁、監視、通訊與弱電規劃',
                    ctaPrimary: '預約現場評估',
                    ctaSecondary: '了解服務內容',
                    stats: [
                        { value: '40+', label: '年產業經驗', icon: 'building' },
                        { value: '2,600+', label: '完成案場', icon: 'users' },
                        { value: '5.0', label: 'Google 評價', icon: 'star' },
                        { value: '1hr', label: '緊急回覆', icon: 'clock' },
                    ],
                },
            },
        },
        {
            slug: 'service-access-control',
            title: '門禁系統',
            pageType: 'service',
            sortOrder: 1,
            seoTitle: '門禁系統規劃與施工｜一帆安全整合',
            seoDescription: '門禁系統規劃、施工、維護與升級，支援人臉辨識、刷卡、對講與考勤整合。',
            sections: { hero: { name: '門禁系統', description: '從小型辦公室到多據點企業，提供穩定、好維護的門禁系統規劃。', icon: 'shield' } },
        },
        {
            slug: 'service-cctv',
            title: '監視系統',
            pageType: 'service',
            sortOrder: 2,
            seoTitle: '監視系統規劃與施工｜一帆安全整合',
            seoDescription: '提供高畫質監視系統規劃、AI 偵測與遠端監看建置，適用辦公室、門市與工地場景。',
            sections: { hero: { name: '監視系統', description: '高畫質影像與穩定錄影架構，協助企業建立更可靠的安防系統。', icon: 'camera' } },
        },
        {
            slug: 'service-phone-system',
            title: '電話總機',
            pageType: 'service',
            sortOrder: 3,
            seoTitle: '電話總機與 IP-PBX 規劃｜一帆安全整合',
            seoDescription: '數位總機、IP-PBX、語音整合與企業通訊規劃，提升內外線協作效率。',
            sections: { hero: { name: '電話總機', description: '協助企業規劃穩定的通訊架構，降低斷線與維護成本。', icon: 'phone' } },
        },
        {
            slug: 'service-attendance',
            title: '考勤系統',
            pageType: 'service',
            sortOrder: 4,
            seoTitle: '考勤系統整合規劃｜一帆安全整合',
            seoDescription: '考勤系統、門禁整合、雲端報表與多點管理規劃，提升人員管理效率。',
            sections: { hero: { name: '考勤系統', description: '讓打卡、報表與管理流程更清楚，並與門禁系統無縫整合。', icon: 'clock' } },
        },
        {
            slug: 'service-integration',
            title: '弱電整合',
            pageType: 'service',
            sortOrder: 5,
            seoTitle: '弱電整合與網路佈線｜一帆安全整合',
            seoDescription: '弱電整合、機櫃規劃、網路佈線與周邊設備建置，提供一致且穩定的基礎架構。',
            sections: { hero: { name: '弱電整合', description: '從佈線到設備整合，建立更穩定、更好管理的企業基礎架構。', icon: 'cable' } },
        },
        {
            slug: 'about',
            title: '關於我們',
            pageType: 'richtext',
            sortOrder: 6,
            seoTitle: '關於一帆安全整合',
            seoDescription: '一帆安全整合長期深耕門禁、監視、通訊與弱電整合，提供規劃、施工與維護服務。',
            richContent: '<h1>關於一帆安全整合</h1><p>一帆安全整合專注於門禁、監視、電話總機與弱電整合工程，協助企業建立穩定、安全、易維護的系統。</p>',
        },
        {
            slug: 'contact',
            title: '聯絡我們',
            pageType: 'contact',
            sortOrder: 7,
            seoTitle: '聯絡一帆安全整合',
            seoDescription: '歡迎來電或線上聯絡一帆安全整合，洽詢門禁、監視、通訊與弱電整合需求。',
            sections: {
                hero: { title: '聯絡我們', subtitle: '歡迎與一帆安全整合討論您的案場需求。' },
                businessHours: [
                    { days: '週一至週五', hours: '09:00 - 18:00' },
                    { days: '週六、週日', hours: '公休' },
                ],
                businessHoursNote: '如有緊急需求，請直接來電聯繫。',
                formTitle: '線上諮詢',
                formSubtitle: '留下需求後，我們會盡快與您聯繫。',
                mapCoordinates: { lat: 25.0268, lng: 121.5449 },
                additionalNote: '',
            },
        },
    ];

    for (const page of pageSeedData) {
        await prisma.page.upsert({
            where: { slug: page.slug },
            update: {},
            create: {
                slug: page.slug,
                title: page.title,
                pageType: page.pageType,
                sortOrder: page.sortOrder,
                seoTitle: page.seoTitle,
                seoDescription: page.seoDescription,
                sections: page.sections || {},
                richContent: page.richContent || null,
                isPublished: true,
            },
        });
    }

    console.log('已建立 ' + pageSeedData.length + ' 筆 CMS 頁面資料');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });