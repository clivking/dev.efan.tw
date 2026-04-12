export interface FaqItem {
    question: string;
    answer: string;
}

export const CCTV_CALCULATOR_FAQ_ITEMS: FaqItem[] = [
    {
        question: '1080p 監視器 30 天需要多大硬碟？',
        answer: '要看攝影機數量、FPS、壓縮格式與每日錄影時數。以 4 支 1080p、H.265、15 FPS、24 小時連續錄影為例，30 天通常已經會落在數 TB 以上。',
    },
    {
        question: '4MP(2K) 監視器一天大約會用多少容量？',
        answer: '4MP(2K) 的容量通常會明顯高於 1080p。若是 H.265、15 FPS、24 小時連續錄影，一天的容量會依鏡頭數量與場景動態快速增加。',
    },
    {
        question: 'H.265 比 H.264 省多少空間？',
        answer: '常見場景下，H.265 大多可比 H.264 省下約 30% 到 50% 的錄影空間，但仍需看品牌、碼流設定與場景動態。',
    },
    {
        question: '移動偵測錄影比較省容量嗎？',
        answer: '通常是，但若場景人流、車流或夜間雜訊高，節省幅度會縮小。重要區域也未必適合只用移動偵測錄影。',
    },
    {
        question: '監視器容量要預留多少安全空間？',
        answer: '第一版預設先抓 10% 安全餘量，適合做快速試算；若案場有戶外夜間、長天數保存或後續擴充需求，建議再往上保留會更穩。',
    },
    {
        question: '8 路 NVR 該配多大硬碟？',
        answer: '要看你接幾支鏡頭、解析度是否到 4MP(2K) 或 4K、是否連續錄影，以及想保存幾天。8 路不代表一定只要一顆小容量硬碟。',
    },
    {
        question: '16 路 NVR 能保存多久錄影？',
        answer: '不能只看通道數，還要看實際使用幾支鏡頭、畫質、FPS 與硬碟容量。相同 16 路主機，保存天數可能差很多。',
    },
    {
        question: '4K 監視器一定要用 H.265 嗎？',
        answer: '不是強制，但如果你要兼顧畫質與容量，4K 搭配 H.265 會更實際。若用 H.264，硬碟需求通常會上升很快。',
    },
    {
        question: '監視器容量不足會發生什麼事？',
        answer: '最常見的是保存天數比預期短，或主機很快覆寫舊影像。對需要追查事件的案場來說，這會直接影響調閱與保存效果。',
    },
    {
        question: '這個試算結果可以直接拿去採購嗎？',
        answer: '可以先拿來抓預算與方向，但正式下單前仍建議把實際攝影機型號、NVR 通道數、硬碟顆數與保存策略一起確認。',
    },
];

export const CCTV_STORAGE_EXAMPLES = [
    {
        title: '4 支 1080p 店面',
        summary: '適合便利商店、小型門市、接待櫃台。',
        specs: '4 支鏡頭 / 1080p / H.265 / 15 FPS / 30 天',
        recommendation: '通常可先從 4TB 到 8TB 級距開始評估，若櫃台與出入口都要 24 小時錄影，建議往上抓。',
    },
    {
        title: '8 支 4MP(2K) 辦公室',
        summary: '適合中型辦公室、門禁出入口、公共區域。',
        specs: '8 支鏡頭 / 4MP(2K) / H.265 / 15 FPS / 30 天',
        recommendation: '常見會進入 8TB 到 16TB 級距，若含會議室、走道、倉儲區，容量通常要保守抓。',
    },
    {
        title: '8 支 4MP(2K) 倉庫',
        summary: '適合有貨架與出貨動線的倉儲空間。',
        specs: '8 支鏡頭 / 4MP(2K) / H.265 / 15 FPS / 60 天',
        recommendation: '因為保存天數拉長，主機與硬碟配置通常要一起升級，16TB 以上會更常見。',
    },
    {
        title: '16 支 1080p 社區',
        summary: '適合大樓公共區、電梯廳、車道口。',
        specs: '16 支鏡頭 / 1080p / H.265 / 15 FPS / 30 天',
        recommendation: '建議直接評估 16 路以上 NVR 與多顆硬碟配置，保留後續擴充空間。',
    },
    {
        title: '16 支 4MP(2K) 工廠',
        summary: '適合廠內動線、出貨區、工作站監看。',
        specs: '16 支鏡頭 / 4MP(2K) / H.265 / 15 FPS / 30 天',
        recommendation: '容量壓力會明顯高於 1080p，通常要以 16TB 以上、多顆硬碟方式規劃。',
    },
    {
        title: '32 支 4K 停車場',
        summary: '適合車牌辨識、車道與戶外夜間監看。',
        specs: '32 支鏡頭 / 8MP(4K) / H.265 / 15 FPS / 30 天',
        recommendation: '這類案場通常不能只看容量，還要同步考慮通道數、硬碟顆數、夜間噪點與後續調閱需求。',
    },
];

export const CCTV_COMPARISON_ROWS = [
    {
        item: '1080p',
        useCase: '店面、辦公室、一般室內區域',
        imageQuality: '基本清楚，適合多數入門案場',
        storagePressure: '較低',
        advice: '預算敏感或鏡頭數較多時，常是實用起點。',
    },
    {
        item: '4MP(2K)',
        useCase: '出入口、公共區域、辦公空間',
        imageQuality: '比 1080p 更細，常見主流配置',
        storagePressure: '中',
        advice: '畫質與容量之間最容易取得平衡。',
    },
    {
        item: '5MP',
        useCase: '需要更高細節的店面、倉庫、工廠',
        imageQuality: '細節更完整',
        storagePressure: '中高',
        advice: '若保存天數長，建議同步拉高硬碟級距。',
    },
    {
        item: '8MP(4K)',
        useCase: '停車場、車道、戶外大範圍監看',
        imageQuality: '高畫質，適合大場景',
        storagePressure: '高',
        advice: '建議搭配 H.265 與較完整的 NVR / 硬碟規劃。',
    },
    {
        item: 'H.264',
        useCase: '舊案場、相容性優先',
        imageQuality: '可用',
        storagePressure: '較高',
        advice: '若容量常不夠，通常優先考慮升級 H.265。',
    },
    {
        item: 'H.265',
        useCase: '新建案場、多鏡頭或高解析度案場',
        imageQuality: '維持高畫質下更省空間',
        storagePressure: '較低',
        advice: '多數新案場都更適合先以 H.265 為主。',
    },
];

export const CCTV_NVR_GUIDE_ROWS = [
    {
        tier: '8 路 NVR',
        fits: '4 到 8 支鏡頭',
        scenes: '小型店面、住辦、小型辦公室',
        storage: '通常從 1 到 2 顆硬碟配置開始評估',
        note: '若後續還要加點位，建議不要抓太滿。',
    },
    {
        tier: '16 路 NVR',
        fits: '8 到 16 支鏡頭',
        scenes: '中型辦公室、社區公共區、倉庫',
        storage: '常見會進入多顆硬碟與較高容量級距',
        note: '是最常見的成長型配置。',
    },
    {
        tier: '32 路 NVR',
        fits: '16 到 32 支鏡頭',
        scenes: '大型社區、工廠、校園、停車場',
        storage: '建議直接規劃多顆硬碟與長期擴充',
        note: '適合點位多、畫質高、保存天數長的案場。',
    },
    {
        tier: '64 路 NVR',
        fits: '32 支以上鏡頭',
        scenes: '大型廠區、園區、跨區集中管理',
        storage: '需要從主機、硬碟、網路一起整體評估',
        note: '通常已經不是單純容量問題，而是整體監控架構。',
    },
];

export const CCTV_CAMERA_GUIDE_ROWS = [
    {
        type: '海螺型攝影機',
        scenes: '店面、辦公區、走道、室內公共區',
        strength: '安裝普遍、畫面穩定、易於規劃',
        storageEffect: '常見搭配 1080p 或 4MP(2K)',
        note: '是多數商用案場的常見主力型號。',
    },
    {
        type: '子彈型攝影機',
        scenes: '戶外、停車場、周界、車道',
        strength: '適合長距離與戶外方向監看',
        storageEffect: '夜間噪點與戶外動態較容易提高容量',
        note: '戶外案場建議容量不要抓太緊。',
    },
    {
        type: '半球型攝影機',
        scenes: '櫃台、辦公室、天花板安裝區',
        strength: '外觀低調，適合室內整體空間',
        storageEffect: '視解析度與安裝位置而定',
        note: '適合重視美觀與室內一致性的案場。',
    },
    {
        type: '快速球攝影機',
        scenes: '停車場、戶外大範圍、園區',
        strength: '可追蹤、可變焦、覆蓋範圍大',
        storageEffect: '高解析與高動態場景下容量壓力較大',
        note: '通常需要更完整的主機與錄影規劃。',
    },
];
