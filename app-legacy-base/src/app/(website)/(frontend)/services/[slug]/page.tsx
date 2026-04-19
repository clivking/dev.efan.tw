import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import JsonLdScript from '@/components/common/JsonLdScript';
import { getCompanyInfo } from '@/lib/company';
import { buildContentMetadata } from '@/lib/content-metadata';
import { getPage } from '@/lib/page-content';
import { getRequestSiteContext } from '@/lib/site-url';
import PageBanner from '@/components/common/PageBanner';
import { toBreadcrumbSchemaItems, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { buildBreadcrumbSchema, buildFaqSchema, buildServiceSchema } from '@/lib/structured-data';

export const revalidate = 3600;

interface Props {
    params: Promise<{ slug: string }>;
}

type ServiceFeature = { title: string; description: string };
type ServiceFaq = { q: string; a: string };
type ServiceScenario = { title: string; description: string };
type ServiceReading = { title: string; href: string; description: string };

type ServiceContent = {
    name: string;
    pageHeading: string;
    title: string;
    description: string;
    longDesc: string[];
    targets: string[];
    features: ServiceFeature[];
    process: string[];
    scenarios?: ServiceScenario[];
    mistakes?: string[];
    relatedReading?: ServiceReading[];
    faq: ServiceFaq[];
    ctaHeading: string;
    ctaSubtitle: string;
};

const SERVICE_SLUGS = ['access-control', 'cctv', 'phone-system', 'attendance', 'integration'] as const;

const SERVICE_CONTENT: Record<(typeof SERVICE_SLUGS)[number], ServiceContent> = {
    'access-control': {
        name: '門禁系統',
        pageHeading: '台北門禁系統規劃與安裝',
        title: '台北門禁系統規劃、安裝與整合｜一帆安全整合有限公司',
        description:
            '台北門禁系統規劃安裝，支援刷卡、指紋、人臉辨識、手機開門。42年實務經驗，從現場評估、權限設計到施工交付，一站式服務。適用辦公室、工廠、共享空間，協助企業做好出入口管理。',
        longDesc: [
            '門禁系統的重點不只是開門方式，而是整體出入口管理流程是否順暢。從門片條件、鎖具型式、使用人員到訪客動線，每個環節都會影響最終的使用體驗。',
            '很多企業會先問哪一台讀卡機或控制器比較便宜，但真正拉開差距的，通常是權限設計、施工細節、停電與消防聯動邏輯，以及未來是否還要再補第二道門、訪客流程或遠端管理。',
            '一帆安全整合會依據現場需求，協助評估卡片、密碼、人臉辨識、手機開門與門口機整合方案，讓權限設定、事件記錄與日常維護更容易落地。',
            '如果你的場域是台北商辦、共享辦公室、診所或多門點空間，越早把門型、動線、樓管限制與管理角色盤清楚，後續越不容易重工。',
        ],
        targets: ['辦公室與商辦空間', '診所與教育場域', '社區入口與公共區域', '有訪客與權限管理需求的空間'],
        features: [
            { title: '多種開門方式', description: '可依空間需求選擇刷卡、密碼、人臉或手機開門，兼顧便利與安全。' },
            { title: '權限與時段管理', description: '依部門、角色與時段設定進出權限，減少人工交接與管理混亂。' },
            { title: '可整合門口機與監視系統', description: '把對講、門禁與監視流程一起規劃，讓管理更一致。' },
            { title: '適合後續擴充', description: '若未來增加門點、訪客流程或遠端管理需求，也能保留擴充空間。' },
        ],
        process: ['盤點門型、動線與管理需求', '評估鎖具、控制器與開門方式', '確認施工方式與整合項目', '完成安裝、測試與交付'],
        scenarios: [
            { title: '台北辦公室主入口升級', description: '針對玻璃門、共享梯廳、訪客常到訪的商辦空間，優先處理主入口安全、櫃台動線與通行紀錄。' },
            { title: '多門點權限分級', description: '適合有辦公區、會議區、機房或倉庫分區的企業，把主管、員工、清潔與廠商權限拆清楚。' },
            { title: '舊系統汰換', description: '當既有門禁只能刷卡開門、沒有權限紀錄或維修越來越頻繁時，通常就要重新整理架構。' },
            { title: '對講與監視整合', description: '若場域同時有門口機、訪客應答與事件追查需求，會建議一開始一起規劃，不要分散採購。' },
        ],
        mistakes: [
            '只比較設備單價，沒有把門型、支架、走線、樓管限制與施工時段算進去。',
            '把讀卡器、按鈕與開門方向裝在不直覺的位置，造成每天都不好用。',
            '先裝設備再想權限角色，最後卡片管理、訪客放行與離職停權都變得很亂。',
            '沒有為第二道門、遠端管理或監視聯動留下擴充空間，之後一加需求就得重做。',
        ],
        relatedReading: [
            { title: '門禁快速諮詢', href: '/tools/access-control-quick-consultation', description: '先回答幾題，快速判斷門數、訪客、遠端管理與系統方向，再決定要不要送出施工資料。' },
            { title: '企業門禁系統完整指南', href: '/guides/2026-enterprise-access-control-guide', description: '先看整體架構、權限設計與整合方向，再決定設備與預算。' },
            { title: '門禁 TCO 採購分析', href: '/guides/2026-access-control-tco-analysis', description: '整理門禁系統最容易忽略的隱藏成本與整體擁有成本。' },
            { title: '台北門禁系統規劃', href: '/locations/taipei-access-control', description: '從台北商辦條件出發，看門型、樓管限制與在地施工情境。' },
            { title: '台北辦公室門禁解決方案', href: '/solutions/taipei-office-access-control', description: '如果你要的是可執行的辦公室出入管理方案，這頁會更貼近商辦場景。' },
        ],
        faq: [
            { q: '小型辦公室適合哪種門禁系統？', a: '若人數不多且管理需求單純，常見會採用卡片、密碼或手機開門；若需要訪客流程或跨樓層管理，則建議採用可擴充的網路型架構。' },
            { q: '門禁系統可以和對講或監視系統整合嗎？', a: '可以，常見整合方式包含門口機開門、監視畫面聯動與事件記錄查詢，能讓出入口管理更完整。' },
            { q: '老舊建物也能安裝門禁嗎？', a: '可以，會先評估門框、配線與供電條件，再選擇適合的磁力鎖、電鎖或門口機做法。' },
            { q: '門禁規劃要先看設備還是先看管理流程？', a: '建議先看管理流程。誰能進、什麼時間能進、訪客怎麼應答，先定清楚後再選設備，後續比較不會重工。' },
        ],
        ctaHeading: '想規劃更穩定的門禁系統？',
        ctaSubtitle: '提供現場評估、設備建議與整合方向討論，協助你把出入口管理流程梳理清楚。',
    },
    cctv: {
        name: '監視系統',
        pageHeading: '台北監視系統規劃與安裝',
        title: '台北監視系統規劃、安裝與錄影整合｜一帆安全整合有限公司',
        description:
            '大台北監視系統規劃，400萬至800萬像素攝影機、AI人形車牌偵測、手機遠端監看、NVR與雲端雙備份。從鏡頭數量、錄影保存天數到後續維運，幫你一次整理到位。',
        longDesc: [
            '監視系統的規劃重點不在於鏡頭數量，而是能否真正覆蓋重要畫面、看得清楚、查得到紀錄。',
            '從畫面範圍、夜間環境、錄影保存天數到遠端查看方式，一開始就規劃完整，會比後續零碎補裝更穩定。',
        ],
        targets: ['辦公室與店面', '工廠與倉儲空間', '社區公共區域', '需要遠端查看與錄影保存的場域'],
        features: [
            { title: '依場域配置鏡頭', description: '依照出入口、走道、櫃台、停車區等需求配置攝影機位置與焦段。' },
            { title: '錄影與保存規劃', description: '根據畫質、通道數與保存天數選擇合適的錄影設備與硬碟配置。' },
            { title: '支援遠端查看', description: '可規劃手機或電腦遠端查看，方便管理者快速掌握現場狀況。' },
            { title: '可搭配 AI 或事件通知', description: '視場域需求，可進一步評估智慧分析與通知機制。' },
        ],
        process: ['確認要看的位置與目的', '規劃鏡頭、錄影主機與保存天數', '安排配線與安裝', '完成測試、教學與交付'],
        relatedReading: [
            { title: '監視器容量計算器', href: '/tools/cctv-storage-calculator', description: '先試算攝影機數量、畫質、FPS 與保存天數需要多少硬碟容量，再比較 NVR 與硬碟配置。' },
            { title: '監視器焦距計算器', href: '/tools/cctv-focal-length-calculator', description: '先抓門口、櫃台、走道或車道口大概要用幾 mm 鏡頭，再回頭確認畫面範圍與焦段。' },
            { title: '台北監視系統解決方案', href: '/solutions/taipei-cctv-system', description: '如果你要看的是台北辦公室、店面或社區案場的整體規劃方式，這頁會更貼近實務情境。' },
        ],
        faq: [
            { q: '監視系統需要幾支攝影機才夠？', a: '要看出入口數量、畫面範圍與管理重點，通常會先確認哪些位置一定要看得到，再決定鏡頭數量與焦段。' },
            { q: '監視器幾 mm 怎麼選？', a: '通常會先看安裝距離和想拍多寬，再回推鏡頭焦距。若你還在抓 2.8mm、4mm、6mm 或 8mm，可以先用我們的監視器焦距計算器試算。' },
            { q: '錄影紀錄可以保存多久？', a: '保存時間與畫質、通道數、硬碟容量有關，規劃時可以依場域需求調整。' },
            { q: '可以用手機查看監視畫面嗎？', a: '可以，多數架構都可搭配手機或電腦遠端查看，但仍需一起評估網路與權限設定。' },
            { q: '錄影硬碟容量要怎麼估？', a: '通常會先看攝影機數量、解析度、FPS、壓縮格式與保存天數，再估算硬碟容量。我們也提供監視器容量計算器，讓你先快速試算。' },
        ],
        ctaHeading: '需要更清楚、好查詢的監視系統？',
        ctaSubtitle: '從鏡頭位置、錄影保存到遠端查看方式，一起評估比較不容易走彎路。',
    },
    'phone-system': {
        name: '總機系統',
        pageHeading: '台北電話總機與 IP PBX 規劃',
        title: '台北電話總機與 IP PBX 規劃更新｜一帆安全整合有限公司',
        description:
            '數位/IP電話總機規劃安裝，支援分機互通、外線配置、電話錄音、行動分機。適合20人以上企業辦公室或工廠，彈性擴充不浪費。我們同時整合門禁與監視，一個窗口搞定所有通訊需求。',
        longDesc: [
            '總機系統不只是電話設備，而是企業對外接待、部門分流與日常通訊的重要基礎。',
            '若現有分機混亂、設備老舊或想升級到 IP PBX，建議先盤點實際通話流程與整合需求，再決定升級方式。',
        ],
        targets: ['中小企業與辦公室', '有分機與櫃台轉接需求的場域', '準備搬遷或更新總機設備的企業', '需要與門口機或客服流程整合的空間'],
        features: [
            { title: '整理外線與分機架構', description: '先釐清櫃台、部門、管理者與對外來電的實際流向。' },
            { title: '評估傳統總機或 IP PBX', description: '依據網路、分機數量與未來擴充需求，決定合適的架構。' },
            { title: '整合門口機與轉接流程', description: '可搭配門口機、櫃台或客服流程規劃，讓來電與訪客接待更順。' },
            { title: '保留未來擴充彈性', description: '若未來有搬遷、遠端辦公或跨據點需求，前期架構可一起評估。' },
        ],
        process: ['盤點現有總機與分機使用方式', '確認通話流程與整合需求', '規劃設備與升級方式', '完成設定、測試與交接'],
        faq: [
            { q: '傳統總機可以升級成 IP PBX 嗎？', a: '可以，但實際做法要看既有分機、網路與通話需求，有些場域適合逐步過渡，有些較適合整體重整。' },
            { q: '總機系統可以和門口機整合嗎？', a: '可以，常見整合方式包含門口機來電轉接、櫃台分流與部門接聽設定。' },
            { q: '企業搬遷時需要重做總機規劃嗎？', a: '通常建議重新盤點，因為新場域的網路、配線與部門動線常會和舊空間不同。' },
        ],
        ctaHeading: '想把總機與分機流程整理得更清楚？',
        ctaSubtitle: '從現況盤點、升級路徑到整合方向，一起評估比較能避免設備買了卻不好用。',
    },
    attendance: {
        name: '考勤系統',
        pageHeading: '台北考勤系統與打卡整合規劃',
        title: '台北考勤系統規劃與門禁整合｜一帆安全整合有限公司',
        description:
            '門禁考勤整合系統，刷卡、指紋或人臉辨識自動記載出勤資料，直接對接薪資計算。支援台北企業既有系統對接，省去人工整理Excel的麻煩。還能依部門或班別設定不同出勤規則。',
        longDesc: [
            '考勤系統要好用，關鍵在於打卡方式是否貼近現場工作流程，以及資料是否能被後續管理作業實際使用。',
            '若場域同時有門禁或多班別需求，建議一開始就把打卡、權限與報表需求一起整理，避免系統彼此切開。',
        ],
        targets: ['中小企業與辦公室', '有多班別或排班需求的單位', '需要門禁與考勤一起管理的場域', '想提升出勤紀錄一致性的企業'],
        features: [
            { title: '依場域選擇打卡方式', description: '可評估卡片、指紋、人臉或其他打卡方式，兼顧現場便利性。' },
            { title: '搭配門禁整合', description: '若已有門禁需求，可一起規劃出入口控管與出勤紀錄流程。' },
            { title: '支援排班與報表需求', description: '依企業管理模式確認出勤規則與後續資料使用方式。' },
            { title: '降低人工整理成本', description: '讓出勤資訊更一致，減少手動抄錄與整理落差。' },
        ],
        process: ['確認打卡場景與人員型態', '選擇設備與資料管理方式', '整合門禁或排班需求', '完成設定、測試與教育訓練'],
        faq: [
            { q: '考勤系統一定要和門禁一起做嗎？', a: '不一定，但如果現場同時有出入口管理需求，一起規劃通常會更順，也能減少重複設備。' },
            { q: '多人班別或輪班也能使用嗎？', a: '可以，規劃時會一起確認班別、權限與資料管理需求。' },
            { q: '考勤資料可以做後續管理嗎？', a: '可以，但實際使用方式會依管理流程與系統架構而有所不同，建議一開始就先盤點。' },
        ],
        ctaHeading: '想讓出勤管理更一致、更省工？',
        ctaSubtitle: '先把打卡流程、設備與後續管理需求理清楚，考勤系統會更實用。',
    },
    integration: {
        name: '弱電整合',
        pageHeading: '台北弱電整合與系統規劃',
        title: '台北弱電整合、配線與安防系統規劃｜一帆安全整合有限公司',
        description:
            '弱電系統整合規劃，專營門禁、監視、網路佈線、機櫃整理與系統聯網。42年整合經驗，從新案規劃到舊系統更新，一次統整減少跨廠商協調成本。台北企業優先服務。',
        longDesc: [
            '弱電整合的價值在於把原本分散的系統與設備整理成更穩定、可維護的架構，而不是各自獨立、彼此難以配合。',
            '若現場同時有網路、門禁、監視、總機或對講需求，越早規劃整合方向，後續施工與維運越容易掌握。',
            '很多場域真正的問題不是缺設備，而是各系統分開做、配線沒有整理、機櫃沒有規劃、後續維修沒有人能快速定位問題。這也是為什麼弱電整合通常要從整體架構下手，而不是只補單一設備。',
            '特別是在裝修、搬遷、擴編或多系統更新的時候，如果沒有先把施工順序、路由、機櫃、供電與管理責任梳理好，之後最常出現的就是反覆重工與跨廠商扯皮。',
        ],
        targets: ['新建或裝修中的商辦空間', '有多套弱電系統需要協調的場域', '需要重新整理配線與機櫃的企業', '準備做整體系統升級的空間'],
        features: [
            { title: '整合配線與系統架構', description: '把網路、門禁、監視、對講等需求一起盤點，避免後續重工。' },
            { title: '重視施工與維護便利性', description: '不只考慮當下可裝，也會評估未來擴充與維修是否方便。' },
            { title: '降低不同廠系統衝突', description: '先整理整體架構，可以減少系統各自為政與互不相容的風險。' },
            { title: '適合整體升級場域', description: '若空間正要裝修、搬遷或重整設備，弱電整合更能發揮價值。' },
        ],
        process: ['盤點現場設備與系統需求', '整理整體架構與施工順序', '確認配線、機櫃與整合方式', '完成施工、測試與交付'],
        scenarios: [
            { title: '辦公室搬遷與重新裝修', description: '最適合一次把網路、門禁、監視、總機與機櫃規劃好，避免裝修完成後再回頭拆修。' },
            { title: '多系統分散且難維護', description: '如果現場已經有多家廠商、不同規格與混亂配線，弱電整合能先整理責任邊界與架構。' },
            { title: '舊設備保留加新系統擴充', description: '保留可用設備、替換高風險節點，再逐步把整體架構拉回可控狀態。' },
            { title: '機櫃與網路環境重整', description: '當系統問題常發生在供電、交換器、路由與線路標示不清時，應從基礎弱電整理開始。' },
        ],
        mistakes: [
            '裝修快結束才開始談弱電，導致管路、機櫃位置與設備點位都只能被動配合。',
            '每個系統找不同廠商各做各的，最後維護責任不清、問題也不好追。',
            '只做當前需要的點位，沒有為後續擴編、第二階段或遠端管理留下空間。',
            '忽略機櫃、供電、標示與文件整理，導致交付後只有原施工人員看得懂。',
        ],
        relatedReading: [
            { title: '弱電與安防採購合規指南', href: '/guides/security-nda-compliance-guide', description: '先理解企業採購、設備來源與後續維護風險，再談整合。' },
            { title: '企業電話總機選型指南', href: '/guides/telecom-architecture-pbx-evaluation', description: '如果整合同時涉及總機與分機架構，這篇能先釐清方向。' },
            { title: '台北辦公室門禁解決方案', href: '/solutions/taipei-office-access-control', description: '看一個整合導向的辦公室場景，理解門禁和弱電怎麼一起規劃。' },
            { title: '台北監視系統解決方案', href: '/solutions/taipei-cctv-system', description: '若你的案場同時要看影像、錄影與網路條件，這篇可一起參考。' },
        ],
        faq: [
            { q: '弱電整合包含哪些項目？', a: '常見會包含網路配線、門禁、監視、對講、總機與相關設備的整合規劃，實際項目仍要依場域需求評估。' },
            { q: '裝修時就要一起規劃嗎？', a: '越早規劃越好，因為配線、管路與設備位置都會影響後續施工與維護。' },
            { q: '已經有部分系統，也能再做整合嗎？', a: '可以，通常會先盤點既有設備與限制，再評估保留、調整或重整的方式。' },
            { q: '弱電整合最常卡住的是什麼？', a: '最常卡在施工順序、設備位置、責任邊界與既有系統兼容性。越早把整體藍圖定下來，後面越好執行。' },
        ],
        ctaHeading: '想把弱電與系統整合一次理順？',
        ctaSubtitle: '從配線、設備到整體管理流程一起評估，通常會比零碎補裝更穩定。',
    },
};

export async function generateStaticParams() {
    return SERVICE_SLUGS.map((slug) => ({ slug }));
}

function getServiceContent(slug: string): ServiceContent | null {
    return SERVICE_CONTENT[slug as keyof typeof SERVICE_CONTENT] || null;
}

function getString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function getStringArray(value: unknown, fallback: string[]): string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim())
        ? (value as string[])
        : fallback;
}

function getFeatureArray(value: unknown, fallback: ServiceFeature[]): ServiceFeature[] {
    if (!Array.isArray(value)) return fallback;
    const normalized = value
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const title = typeof (item as any).title === 'string' ? (item as any).title.trim() : '';
            const description =
                typeof (item as any).description === 'string'
                    ? (item as any).description.trim()
                    : typeof (item as any).desc === 'string'
                      ? (item as any).desc.trim()
                      : '';
            if (!title || !description) return null;
            return { title, description };
        })
        .filter(Boolean) as ServiceFeature[];
    return normalized.length > 0 ? normalized : fallback;
}

function getFaqArray(value: unknown, fallback: ServiceFaq[]): ServiceFaq[] {
    if (!Array.isArray(value)) return fallback;
    const normalized = value
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const q = typeof (item as any).q === 'string' ? (item as any).q.trim() : '';
            const a = typeof (item as any).a === 'string' ? (item as any).a.trim() : '';
            if (!q || !a) return null;
            return { q, a };
        })
        .filter(Boolean) as ServiceFaq[];
    return normalized.length > 0 ? normalized : fallback;
}

function getScenarioArray(value: unknown, fallback: ServiceScenario[] = []): ServiceScenario[] {
    if (!Array.isArray(value)) return fallback;
    const normalized = value
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const title = typeof (item as any).title === 'string' ? (item as any).title.trim() : '';
            const description =
                typeof (item as any).description === 'string' ? (item as any).description.trim() : '';
            if (!title || !description) return null;
            return { title, description };
        })
        .filter(Boolean) as ServiceScenario[];
    return normalized.length > 0 ? normalized : fallback;
}

function getReadingArray(value: unknown, fallback: ServiceReading[] = []): ServiceReading[] {
    if (!Array.isArray(value)) return fallback;
    const normalized = value
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const title = typeof (item as any).title === 'string' ? (item as any).title.trim() : '';
            const href = typeof (item as any).href === 'string' ? (item as any).href.trim() : '';
            const description =
                typeof (item as any).description === 'string' ? (item as any).description.trim() : '';
            if (!title || !href || !description) return null;
            return { title, href, description };
        })
        .filter(Boolean) as ServiceReading[];
    return normalized.length > 0 ? normalized : fallback;
}

function getSectionData(page: any, fallback: ServiceContent) {
    const sections = (page?.sections || {}) as any;

    return {
        name: getString(sections.hero?.name, fallback.name),
        pageHeading: getString(sections.hero?.title, fallback.pageHeading),
        title: getString(page?.seoTitle, fallback.title),
        description: getString(sections.hero?.description || page?.seoDescription, fallback.description),
        longDesc: getStringArray(sections.longDesc, fallback.longDesc),
        targets: getStringArray(sections.targets, fallback.targets),
        features: getFeatureArray(sections.features, fallback.features),
        process: getStringArray(sections.process, fallback.process),
        scenarios: getScenarioArray(sections.scenarios, fallback.scenarios),
        mistakes: getStringArray(sections.mistakes, fallback.mistakes || []),
        relatedReading: getReadingArray(sections.relatedReading, fallback.relatedReading),
        faq: getFaqArray(sections.faq, fallback.faq),
        ctaHeading: getString(sections.cta?.heading, fallback.ctaHeading),
        ctaSubtitle: getString(sections.cta?.subtitle, fallback.ctaSubtitle),
        buttonLink: getString(sections.cta?.buttonLink, '/contact'),
    };
}

function pickServiceMetadataDescription(page: any, data: ReturnType<typeof getSectionData>) {
    const candidates = [
        typeof page?.seoDescription === 'string' ? page.seoDescription.trim() : '',
        typeof page?.excerpt === 'string' ? page.excerpt.trim() : '',
        data.description,
    ].filter(Boolean);

    if (candidates.length > 0) {
        return candidates[0];
    }

    const expandedFallback = `${data.description} ${data.longDesc[0] || ''}`.trim();
    return expandedFallback || data.description;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const fallback = getServiceContent(slug);
    if (!fallback) {
        return {};
    }

    const [page, company, site] = await Promise.all([getPage(`service-${slug}`), getCompanyInfo(), getRequestSiteContext()]);
    const data = getSectionData(page, fallback);
    const metadataDescription = pickServiceMetadataDescription(page, data);

    return buildContentMetadata({
        site,
        pathname: `/services/${slug}`,
        title: data.title,
        description: metadataDescription,
        siteName: company.name,
        type: 'website',
        ogImage: page?.ogImage || '/images/hero.webp',
    });
}

export default async function ServicePage({ params }: Props) {
    const { slug } = await params;
    const fallback = getServiceContent(slug);
    if (!fallback) {
        notFound();
    }

    const [page, company, site] = await Promise.all([getPage(`service-${slug}`), getCompanyInfo(), getRequestSiteContext()]);
    const data = getSectionData(page, fallback);
    const metadataDescription = pickServiceMetadataDescription(page, data);

    const serviceSchema = buildServiceSchema({
        url: `${site.origin}/services/${slug}`,
        name: data.name,
        description: metadataDescription,
        organizationId: `${site.origin}/#organization`,
        areaServed: 'Taipei, Taiwan',
        serviceType: data.name,
    });

    const breadcrumbs = withHomeBreadcrumb({ label: '服務項目', href: '/#services' }, data.name);
    const breadcrumbSchema = buildBreadcrumbSchema(toBreadcrumbSchemaItems(breadcrumbs, site.origin, `/services/${slug}`));

    const faqSchema = buildFaqSchema(
        data.faq.map((item) => ({
            question: item.q,
            answer: item.a,
        })),
    );

    return (
        <div className="flex w-full flex-col">
            <JsonLdScript data={serviceSchema} />
            <JsonLdScript data={breadcrumbSchema} />
            <JsonLdScript data={faqSchema} />

            <PageBanner
                title={data.pageHeading}
                subtitle={data.description}
                breadcrumbs={breadcrumbs}
            />

            <section className="relative overflow-hidden bg-white py-24">
                <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/2 rounded-full bg-gradient-to-bl from-efan-accent/5 to-transparent" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <h2 className="mb-8 text-2xl font-black text-efan-primary md:text-3xl">服務說明</h2>
                            <div className="mb-14 space-y-6 text-lg leading-[2] text-gray-600">
                                {data.longDesc.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>

                            <h2 className="mb-10 text-2xl font-black text-efan-primary md:text-3xl">服務重點</h2>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {data.features.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-efan-accent/40 hover:shadow-lg"
                                    >
                                        <h3 className="mb-2 text-lg font-bold text-efan-primary-dark">{feature.title}</h3>
                                        <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-efan-primary-dark via-efan-primary to-efan-primary-light p-8 text-white shadow-2xl shadow-efan-primary/20">
                                <div className="absolute -right-12 -top-12 hidden h-32 w-32 rounded-full bg-efan-accent/20 blur-2xl md:block" />
                                <h3 className="relative mb-6 flex items-center gap-2 text-xl font-black">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-efan-accent" />
                                    適合對象
                                </h3>
                                <ul className="relative space-y-3.5">
                                    {data.targets.map((target) => (
                                        <li key={target} className="flex items-center gap-3 font-medium text-white/90">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-efan-accent/20 text-xs text-efan-accent">
                                                +
                                            </span>
                                            {target}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-[28px] border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-8 shadow-lg">
                                <h3 className="mb-4 text-lg font-black text-efan-primary">免費需求討論</h3>
                                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                                    如果你正在評估 {data.name}、系統更新或整合方向，我們可以先從現場條件與管理需求一起討論。
                                </p>
                                <div className="space-y-2">
                                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">聯絡電話</div>
                                    <a
                                        href={`tel:${company.phone}`}
                                        className="block text-2xl font-black text-efan-primary transition-colors hover:text-efan-accent"
                                    >
                                        {company.phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
                <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tl from-efan-primary/5 to-transparent" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <span className="mb-4 inline-block rounded-full bg-efan-primary/10 px-4 py-1.5 text-sm font-bold text-efan-primary">
                            HOW WE WORK
                        </span>
                        <h2 className="mb-4 text-3xl font-black text-efan-primary md:text-4xl">服務流程</h2>
                        <p className="text-lg font-medium text-gray-500">從需求盤點到安裝交付，盡量把現場條件與後續使用一起想清楚。</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {data.process.map((step, index) => (
                            <div
                                key={step}
                                className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-efan-primary/5"
                            >
                                <div className="mb-5 text-4xl font-black text-efan-primary/10">{String(index + 1).padStart(2, '0')}</div>
                                <h3 className="text-lg font-black text-efan-primary-dark">{step}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {data.scenarios && data.scenarios.length > 0 ? (
                <section className="relative overflow-hidden bg-white py-24">
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <span className="mb-4 inline-block rounded-full bg-efan-primary/10 px-4 py-1.5 text-sm font-bold text-efan-primary">
                                SCENARIOS
                            </span>
                            <h2 className="mb-4 text-3xl font-black text-efan-primary md:text-4xl">常見場景</h2>
                            <p className="text-lg font-medium text-gray-500">不是每個案場都適合同一套做法，先看你們比較接近哪一種使用情境。</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {data.scenarios.map((scenario) => (
                                <div key={scenario.title} className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-7 shadow-sm">
                                    <h3 className="mb-3 text-xl font-black text-efan-primary-dark">{scenario.title}</h3>
                                    <p className="text-sm leading-7 text-gray-600 md:text-base">{scenario.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {data.mistakes && data.mistakes.length > 0 ? (
                <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
                    <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <span className="mb-4 inline-block rounded-full bg-efan-accent/10 px-4 py-1.5 text-sm font-bold text-efan-accent">
                                COMMON MISTAKES
                            </span>
                            <h2 className="mb-4 text-3xl font-black text-efan-primary md:text-4xl">常見錯誤</h2>
                            <p className="text-lg font-medium text-gray-500">很多案場不是設備買錯，而是前期判斷少了幾個關鍵條件。</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {data.mistakes.map((mistake) => (
                                <div key={mistake} className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
                                    <p className="text-sm leading-7 text-gray-700 md:text-base">{mistake}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {data.relatedReading && data.relatedReading.length > 0 ? (
                <section className="relative overflow-hidden bg-white py-24">
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <span className="mb-4 inline-block rounded-full bg-efan-primary/10 px-4 py-1.5 text-sm font-bold text-efan-primary">
                                RELATED READING
                            </span>
                            <h2 className="mb-4 text-3xl font-black text-efan-primary md:text-4xl">延伸閱讀</h2>
                            <p className="text-lg font-medium text-gray-500">如果你還在比較方案、地區情境或整合方向，可以先從這幾頁接著看。</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {data.relatedReading.map((item) => (
                                <Link key={item.href} href={item.href} className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                                    <h3 className="mb-3 text-xl font-black text-efan-primary-dark">{item.title}</h3>
                                    <p className="text-sm leading-7 text-gray-600 md:text-base">{item.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="relative overflow-hidden bg-white py-24">
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-14 text-center">
                        <span className="mb-4 inline-block rounded-full bg-efan-accent/10 px-4 py-1.5 text-sm font-bold text-efan-accent">
                            FAQ
                        </span>
                        <h2 className="mb-4 text-3xl font-black text-efan-primary md:text-4xl">常見問題</h2>
                        <p className="font-medium text-gray-500">整理規劃 {data.name} 時最常被問到的幾個重點。</p>
                    </div>
                    <div className="space-y-3">
                        {data.faq.map((item, index) => (
                            <details
                                key={item.q}
                                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
                            >
                                <summary className="flex cursor-pointer select-none items-center justify-between p-6 md:p-7">
                                    <span className="flex items-center gap-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-efan-accent to-orange-400 text-xs font-black text-white">
                                            Q{index + 1}
                                        </span>
                                        <span className="text-sm font-bold text-efan-primary-dark transition-colors group-hover:text-efan-accent md:text-base">
                                            {item.q}
                                        </span>
                                    </span>
                                    <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all duration-300 group-open:rotate-45">
                                        +
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 pt-0 md:px-7 md:pb-7">
                                    <div className="ml-0.5 border-l-2 border-efan-accent/20 pl-12 text-sm leading-relaxed text-gray-600 md:text-base">
                                        {item.a}
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden py-28">
                <div className="absolute inset-0 bg-gradient-to-br from-efan-primary-dark via-efan-primary to-efan-primary-light" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-efan-accent/20 via-transparent to-transparent" />
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="relative mx-auto max-w-4xl px-4 text-center">
                    <h2 className="mb-5 text-3xl font-black leading-tight text-white md:text-4xl">{data.ctaHeading}</h2>
                    <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-white/70">{data.ctaSubtitle}</p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href={data.buttonLink}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-efan-accent px-10 py-4 text-lg font-black text-white shadow-2xl shadow-efan-accent/40 transition-all hover:bg-efan-accent-dark hover:shadow-efan-accent/60 active:scale-95"
                        >
                            詢問需求與規劃方向
                        </Link>
                        <a
                            href={`tel:${company.phone}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
                        >
                            直接來電洽詢
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
