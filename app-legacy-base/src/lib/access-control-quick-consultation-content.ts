export const ACCESS_CONTROL_QUICK_CONSULTATION_FAQ_ITEMS = [
    {
        question: '這頁是在做線上報價嗎？',
        answer:
            '不是。這頁先幫你把場域、門數、訪客與管理需求整理成規劃方向，讓你先知道該往哪種門禁架構走；看完結果後，再決定要不要補施工資料送出。',
    },
    {
        question: '小型辦公室也適合用這支工具嗎？',
        answer:
            '適合。即使只有 1 到 2 個出入口，只要你需要刷卡、手機開門或權限紀錄，先用這支工具抓方向，通常能少走很多冤枉路。',
    },
    {
        question: '如果未來要串考勤或遠端管理，現在就要一起考慮嗎？',
        answer:
            '建議要。門禁最常見的重工，是前面只看開門設備，後面才補遠端管理、訪客流程或考勤整合，結果控制器、配線與權限角色都要重整。',
    },
    {
        question: '門禁快速諮詢送出後，工程師會看到什麼？',
        answer:
            '工程師會收到你填的施工資料，以及這頁整理好的門數、場域、訪客需求、開門偏好、系統建議和規劃提醒，後續比較容易直接接著細化方案或進一步估價。',
    },
    {
        question: '這份摘要之後可以接 AI 報價嗎？',
        answer:
            '可以。這次的送出內容會把門禁需求整理成一致的結構化摘要，後續不論是工程師人工判斷，或要接 AI 初步估價與方案建議，都更容易延伸。',
    },
];

export const ACCESS_CONTROL_QUICK_CONSULTATION_HOW_TO_STEPS = [
    {
        name: '先選場域與出入口規模',
        text: '先抓辦公室、診所、店面或社區場景，再確認大概有幾個門點。',
    },
    {
        name: '補開門與管理需求',
        text: '把刷卡、手機、人臉、訪客流程、遠端管理和考勤整合需求一起勾出來。',
    },
    {
        name: '先看門禁架構建議',
        text: '工具會先回覆你比較適合走輕量型、多門控制器型，還是網路型 / 多門點架構。',
    },
    {
        name: '需要時再送出施工資料',
        text: '確認方向後，再決定要不要補聯絡資訊與安裝地址，讓工程師接著細化。',
    },
];

export const ACCESS_CONTROL_QUICK_CONSULTATION_EXAMPLES = [
    {
        title: '台北辦公室 3 門',
        inputs: '員工 + 訪客，想刷卡 + 手機，還要遠端管理',
        answer: '通常會先落在多門控制器型門禁，並保留訪客放行與後續擴充空間。',
    },
    {
        title: '診所 1 到 2 門',
        inputs: '員工為主，偶爾訪客，想要穩定好上手',
        answer: '多半可先從輕量型或小型控制器方向看，重點是把櫃台與門口流程一起想清楚。',
    },
    {
        title: '工廠或倉庫 8 門以上',
        inputs: '門點較多，管理角色複雜，未來還會擴充',
        answer: '通常更適合網路型 / 多門點架構，不建議把每一道門切成彼此獨立的做法。',
    },
];

export const ACCESS_CONTROL_PRODUCT_GUIDES = [
    {
        title: '門禁控制器',
        description: '先看 1 門、2 門到多門控制器方向，方便比對擴充性與管理方式。',
        href: '/products/category/access-control',
        cta: '看控制器產品',
        image: '/api/uploads/products/AR-727-E/images/AR-727-E_01_front.png',
        alt: 'SOYAL 門禁控制器',
    },
    {
        title: '讀卡機與感應器',
        description: '適合刷卡、密碼或感應卡方向，通常會和控制器、門鎖一起評估。',
        href: '/products/category/reader',
        cta: '看讀卡機產品',
        image: '/api/uploads/products/AR-837-E/images/AR-837-E_01_front.png',
        alt: 'SOYAL 讀卡機',
    },
    {
        title: '電子鎖與開門配件',
        description: '門片、門框和施工條件不同，鎖具與出門配件也要一起看。',
        href: '/products/category/access-accessories',
        cta: '看電子鎖產品',
        image: '/api/uploads/products/AR-BE-180-078/images/AR-BE-180-078_01_front.png',
        alt: '門禁電子鎖與按鈕配件',
    },
];
