export const BRAND = {
    // Primary: 深藍（安全、專業）
    primary: '#1B3A5C',
    primaryLight: '#2A5A8C',
    primaryDark: '#0F2440',

    // Accent: 橙色（CTA、活力）
    accent: '#E8792B',
    accentLight: '#F09040',
    accentDark: '#C56020',

    // Neutral
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray500: '#6B7280',
    gray700: '#374151',
    gray900: '#111827',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
} as const;

export const COMPANY = {
    name: '一帆安全整合有限公司',
    nameEn: 'Efan Security Integration',
    phone: '02-7730-1158',
    email: 'safekings@gmail.com',
    address: '台北市大安區四維路14巷15號7樓之1',
    tagline: '42年專業門禁×監視×總機整合｜超過2,600家企業信賴',
    googleRating: 5.0,
    googleReviews: 18,
    googleViews: 7015,
    yearsInBusiness: 42,
    clientCount: 2600,
    googleBusiness: '台北安全王',
} as const;

export const SERVICES = [
    { id: 'access-control', name: '門禁系統', shortDesc: '刷卡、指紋、人臉辨識，進出管理一站到位', icon: '🔐', iconName: 'KeyRound', href: '/services/access-control' },
    { id: 'cctv', name: '監視錄影', shortDesc: '高畫質攝影機＋AI智慧偵測，24小時守護', icon: '📹', iconName: 'Video', href: '/services/cctv' },
    { id: 'phone-system', name: '電話總機', shortDesc: '數位/IP總機規劃安裝，外線分機靈活配置', icon: '📞', iconName: 'Phone', href: '/services/phone-system' },
    { id: 'attendance', name: '考勤薪資', shortDesc: '打卡系統＋出勤報表，人事管理輕鬆搞定', icon: '⏰', iconName: 'Clock', href: '/services/attendance' },
    { id: 'integration', name: '弱電整合', shortDesc: '網路佈線、機櫃整理、系統整合一次到位', icon: '🔌', iconName: 'Plug', href: '/services/integration' },
] as const;

export const SERVICE_DETAILS: Record<string, any> = {
    'access-control': {
        name: '門禁系統',
        title: '台北門禁系統安裝推薦｜刷卡×指紋×人臉辨識｜一帆安全整合',
        description: '台北門禁系統安裝首選。42年施工經驗、2,600+企業實績。刷卡、指紋、人臉辨識、手機遠端開門一站整合。免費到場評估，施工整齊、售後有人。一帆安全整合 02-7730-1158',
        longDesc: '門禁系統不只是一個讀卡機和一把電鎖，而是一套管好「誰能進、什麼時候能進、進出紀錄怎麼查」的完整管理工具。\n\n一帆從民國 73 年開始做弱電工程，門禁系統是我們最核心的項目之一。42 年來服務超過 2,600 家企業，從單一辦公室大門到整棟大樓的分層管制、從傳統感應卡到 AI 人臉辨識，我們都有成熟的施工經驗。\n\n我們重視的不只是設備選型，更在意安裝品質——讀卡機埋入式安裝，與牆面齊平；電鎖安裝嚴絲合縫，不破壞門框美觀。線路走明管或暗管，現場乾淨整齊。\n\n如果你正在找台北地區的門禁系統廠商，歡迎先打電話跟我們聊聊。不管是新裝、舊換新、還是多點統一管理，我們都能幫你規劃出穩定、好用、好維護的方案。',
        targets: ['辦公室新裝潢 / 搬遷', '社區大樓門禁升級', '工廠 / 倉庫出入管制', '實驗室 / 機房高安全管制', '共享空間 / 商務中心', '連鎖門市統一管理', '診所 / 藥局 / 補習班', '既有系統老舊更新'],
        features: [
            { title: '刷卡 / 感應卡門禁', desc: 'Mifare 感應卡系統，適合辦公室、社區、工廠等場域，發卡換卡方便' },
            { title: '指紋辨識門禁', desc: '防代刷、不需帶卡，適合高安全需求的機房、實驗室、倉庫' },
            { title: 'AI 人臉辨識', desc: '非接觸式驗證，0.3 秒完成辨識，適合大樓門廳與訪客動線' },
            { title: '手機 APP 遠端開門', desc: '透過藍牙或網路遠端控制門鎖，訪客到了不用跑去開門' },
            { title: '多門分層權限管理', desc: '不同樓層、不同時段、不同身份的進出權限獨立設定' },
            { title: '即時進出紀錄查詢', desc: '電腦或手機即時查看人員進出歷史，異常事件自動推播' },
            { title: '訪客通行 QR Code', desc: '提供臨時通行權限，訪客掃碼即可通行，時效自動過期' },
            { title: '門禁 × 考勤整合', desc: '刷卡進門同時完成出勤打卡，一機兩用省設備費' },
        ],
        gallery: [
            { src: '/images/portfolio/flush-mount-card-reader.webp', alt: '埋入式門禁讀卡機安裝完工 美觀耐看的專業施工', caption: '埋入式讀卡機，美觀耐看' },
            { src: '/images/portfolio/anodized-lock-precision-cut.webp', alt: '陽極鎖木框精準開孔 嚴絲合縫的門禁安裝工藝', caption: '陽極鎖木框開孔，嚴絲合縫' },
            { src: '/images/portfolio/weshaire-ai-face-recognition.webp', alt: 'WeShaire AI 臉部辨識門禁系統安裝完工', caption: 'AI 臉部辨識門禁' },
            { src: '/images/portfolio/huanan-leasing-face-recognition.webp', alt: '華南國際租賃 SOYAL 人臉辨識門禁系統安裝', caption: '華南國際租賃 — 人臉辨識門禁' },
            { src: '/images/portfolio/soyal-keypad-access-control.webp', alt: 'SOYAL 感應讀卡機門禁系統安裝於現代辦公室', caption: 'SOYAL 感應讀卡機' },
            { src: '/images/portfolio/soyal-fingerprint-reader-marble.webp', alt: 'SOYAL 指紋辨識門禁讀卡機安裝於大理石牆面', caption: '指紋辨識讀卡機' },
            { src: '/images/portfolio/glass-door-access-intercom.webp', alt: '玻璃門門禁系統搭配對講機專業安裝', caption: '玻璃門門禁 + 對講機' },
            { src: '/images/portfolio/yisheng-office-card-reader.webp', alt: '宜盛企業辦公室門禁刷卡系統安裝', caption: '宜盛企業 — 辦公室門禁' },
            { src: '/images/portfolio/office-door-soyal-maglock.webp', alt: '辦公室門框 SOYAL 讀卡機搭配電磁鎖安裝', caption: '讀卡機 + 電磁鎖安裝' },
            { src: '/images/portfolio/infrared-sensor-door-opener.webp', alt: '紅外線感應自動開門系統安裝完工', caption: '紅外線感應開門' },
            { src: '/images/portfolio/hongxi-design-fingerprint-access.webp', alt: '宏璽設計公司指紋辨識門禁系統安裝', caption: '宏璽設計 — 指紋辨識門禁' },
            { src: '/images/portfolio/wood-door-keypad-reader.webp', alt: '木紋門框密碼讀卡機門禁安裝 簡約美觀', caption: '木紋門框密碼讀卡機' },
            { src: '/images/portfolio/soyal-exit-button-glass-door.webp', alt: 'SOYAL 出門按鈕安裝於辦公室玻璃門框', caption: 'SOYAL 出門按鈕' },
            { src: '/images/portfolio/concrete-wall-intercom-access.webp', alt: '清水模牆面門禁讀卡機搭配對講機安裝', caption: '清水模牆面門禁 + 對講機' },
        ],
        faq: [
            { q: '門禁系統安裝要多少錢？', a: '視規模不同，單一門禁約 NT$8,000–30,000 不等。建議先加Line，拍現場大門照片，我們會依現場條件提供透明報價。' },
            { q: '指紋辨識和人臉辨識差在哪？', a: '指紋成本低、適合小型辦公室；人臉辨識免接觸、適合大樓門廳。兩者都能搭配考勤功能。' },
            { q: '門禁系統可以手機遠端開門嗎？', a: '可以。透過藍牙或網路 APP，不在現場也能遠端控制門鎖，也可以產生臨時 QR Code 給訪客。' },
            { q: '舊的門禁系統可以升級嗎？', a: '大部分可以。我們會先場勘現有設備，盡量沿用既有線路、減少破壞，降低升級成本。' },
            { q: '門禁系統可以同時當考勤打卡嗎？', a: '可以。刷卡進門的同時自動記錄出勤時間，省去額外的打卡機設備。' },
            { q: '安裝需要多久？', a: '單一門禁約半天至一天。大型專案依場勘後排程，通常 3–7 個工作天。' },
        ],
    },
    'cctv': {
        name: '監視錄影',
        title: '監視器安裝 | 高畫質IP攝影機',
        description: '高畫質監視錄影系統，支援手機遠端監看。可選配 AI 智慧偵測功能，包括人形偵測、車牌辨識等進階功能。',
        longDesc: '在數位監控時代，清晰度與即時性是關鍵。一帆提供主流的高畫質 IP 數位監控系統，解析度可達 4K 等級。除了基本的 24 小時錄影，我們更擅長佈建 AI 智慧偵測，當有人形入侵或特定車輛進入時，系統會立即推播警報至您的手機。無論您身在何處，都能透過雲端技術守護現場。',
        targets: ['零售店面/連鎖餐廳', '住宅/倉庫安防', '停車場車牌監測', '工地安防巡查'],
        features: [
            { title: '超高畫質鏡頭', desc: '提供 400 萬至 800 萬畫素之數位攝影機' },
            { title: '強效夜視技術', desc: '在極低光源環境下依然能拍清細微動態' },
            { title: 'AI 智慧偵測', desc: '精準辨識人形與車輛，過濾光影大幅減少誤報' },
            { title: '手機行動監看', desc: '免固定 IP 也能夠輕鬆遠端即時連線監看' },
            { title: '雲端與本地備份', desc: '支援本地 NVR 錄影與緊急雲端異地備份機制' },
            { title: '多點集中管理', desc: 'CMS 中央監控軟體，讓跨門市、跨廠區畫面一目了然' }
        ]
    },
    'phone-system': {
        name: '電話總機',
        title: '電話總機安裝 | 數位IP總機',
        description: '數位總機及 IP 總機規劃安裝。外線、分機靈活配置，支援語音導覽、通話錄音等功能。',
        longDesc: '穩定的溝通是企業運營的基礎。我們專精於數位總機 (PABX) 與新型網路總機 (IP-PBX) 的建置。不論是傳統的類比線路整合，還是跨地區的網路分機串聯，我們都能幫您規劃出成本最低、通訊最靈活的架構。支援東訊 (TECOM)、國際牌 (Panasonic) 與雲端總機等多種品牌方案。',
        targets: ['新創辦公室', '醫學診所/藥局', '補習班/幼兒園', '分散型連鎖據點'],
        features: [
            { title: '智慧語音總機', desc: '自動轉接分機，提升公司專業形象' },
            { title: '通話錄音系統', desc: '保障服務品質並留存通話內容，減少糾紛' },
            { title: '行動分機整合', desc: '手機就是分機，外出照樣接聽公司業務電話' },
            { title: '彈性擴充外線', desc: '依公司規模隨時增加分機數量，擴充成本低' },
            { title: '電腦電話整合', desc: '搭配軟體直接在電腦螢幕上點擊撥號控制' },
            { title: '跨區據點串聯', desc: '將多個辦公室總機網路化跨區互通，分機互打免費' }
        ]
    },
    'attendance': {
        name: '考勤薪資',
        title: '考勤系統 | 打卡出勤管理',
        description: '多種打卡方式搭配出勤報表系統。可與門禁系統連動，一機多用，降低設備投資與人事管理成本。',
        longDesc: '告別傳統紙本或打卡鐘的繁瑣！一帆提供現代化的數位考勤報表系統，支援多種生物識別打卡方式，防止代打卡弊端。所有打卡數據自動產出考勤表（遲到、早退、加班、請假統計），大幅縮減人事核薪的時間。更棒的是，它能與我們的門禁系統完全整合，進門即完成打卡。',
        targets: ['中小企業', '連鎖餐飲', '製造業工廠', '外勤比例高的企業'],
        features: [
            { title: '多種打卡載體', desc: '指紋、人臉、藍牙、GPS 與卡片全面支持' },
            { title: '雲端報表管理', desc: '登入網頁即可產出符合勞基法的假勤與薪資報表' },
            { title: '與門禁合一', desc: '刷卡進門同時打卡，降低建置成本，管理更直覺' },
            { title: '手機遠端管理', desc: '管理者可隨時查看當日人員出勤狀態與外勤打卡' },
            { title: '異地據點彙整', desc: '多個分公司的打卡數據自動同步回總部伺服器' },
            { title: '複雜排班設定', desc: '支援三班制、變形工時的複雜排班與加班費快速計算' }
        ]
    },
    'integration': {
        name: '弱電整合',
        title: '弱電整合 | 網路佈線機櫃整理',
        description: '網路佈線、機櫃整理、設備整合的專業服務。將門禁、監視、總機、網路等系統統一管理。',
        longDesc: '混亂的機房線路是風險的來源。一帆弱電整合隊提供新辦公室的環境佈線 (Structured Cabling)、機櫃整理規劃與網路建構服務。我們能將網路佈線、門禁控制、電力備援 (UPS) 與弱電箱配置做最優化的整合排列。無論是新場拓點還是舊機房翻新，都能讓您的弱電設備清爽好維護。',
        targets: ['辦公室裝修', '機房搬遷建置', '舊線路整理翻新', '全棟網路規劃'],
        features: [
            { title: '專業佈線工程', desc: '符合 Cat.5e / Cat.6 / 光纖 等高階傳輸標準之配管配線' },
            { title: '機櫃美化整理', desc: '告別蜘蛛網般的混亂線路，提升散熱與設備穩定度' },
            { title: 'UPS 電力保護', desc: '嚴格確保關鍵安防與網路設備在斷電時能持續運作' },
            { title: '網路環境建構', desc: '商用路由器、Wi-Fi AP 與 PoE 交換機頻寬設定優化' },
            { title: '一站式監工', desc: '無需分開發包，我們統一統籌安防與弱電需求，保證進度' },
            { title: '完整標示與驗收', desc: '每條線路兩端皆套管標示，並以專業儀器實測通過才交件' }
        ]
    }
} as const;

export const NOTABLE_CLIENTS = [
    '國防大學理工學院',
    '國防部',
    '仁愛總統官邸',
    '台北市政府',
    '國立政治大學',
    '國立師範大學',
    '台北科技大學',
    '台灣壽司郎',
    '台灣富美家',
    'Nikon',
    'Leica',
    'Publicis',
    '倫飛電腦',
    '無國界醫生',
] as const;
