export interface FocalFaqItem {
    question: string;
    answer: string;
}

export const CCTV_FOCAL_FAQ_ITEMS: FocalFaqItem[] = [
    {
        question: '監視器 2.8mm、4mm、6mm 差在哪裡？',
        answer: '焦距越小，畫面越廣；焦距越大，畫面越窄但看得更集中。2.8mm 常見於近距離廣角，4mm 與 6mm 常用在門口、櫃台與走道，8mm 以上則更適合拉遠看重點區域。',
    },
    {
        question: '門口監視器通常要選幾 mm？',
        answer: '若是近距離門口、店面入口或櫃台前方，多數案場會先從 2.8mm 或 4mm 開始評估；如果距離拉長，或想把人臉與車牌看得更集中，再往 6mm、8mm 或更高焦距看。',
    },
    {
        question: '焦距計算器算出 5.6mm，我該買 6mm 還是 4mm？',
        answer: '一般會優先看 6mm，因為它比 4mm 更接近 5.6mm。若你更在意看清楚重點而不是多看範圍，通常會偏向往上選；若更在意廣角覆蓋，再回頭比較 4mm。',
    },
    {
        question: '感光元件尺寸會影響焦距試算嗎？',
        answer: '會。同樣 4mm 鏡頭，搭配不同感光元件尺寸時，可看到的畫面範圍會不一樣，所以工具裡需要一起選感光元件大小。',
    },
    {
        question: '焦距算對了，就一定看得清楚嗎？',
        answer: '不一定。焦距只是在解決看多寬、看多遠，實際清晰度還會受解析度、安裝高度、夜間光線、快門與補光影響。正式規劃時仍要一起評估。',
    },
    {
        question: '這個工具適合拿來做採購前判斷嗎？',
        answer: '適合。它很適合在採購前先抓出鏡頭焦段方向，判斷 2.8mm、4mm、6mm 或 8mm 哪個比較合理；正式下單前，再把實際安裝位置與鏡頭型號一起確認會更穩。',
    },
];

export const CCTV_FOCAL_LENS_GUIDE = [
    {
        lens: '2.8mm',
        degrees: '約 88°',
        scene: '近距離廣角、店面入口、室內公共區',
        feel: '看得廣，但單一目標會比較小',
        advice: '適合想先把範圍涵蓋進來的案場。',
    },
    {
        lens: '4mm',
        degrees: '約 68°',
        scene: '櫃台、門口、辦公室走道',
        feel: '比 2.8mm 更集中，仍保有實用視角',
        advice: '是商辦與店面很常見的起點。',
    },
    {
        lens: '6mm',
        degrees: '約 48°',
        scene: '中距離出入口、倉庫通道、車道前段',
        feel: '畫面更集中，主體更容易看清楚',
        advice: '適合已經知道重點範圍、不想拍太廣的場景。',
    },
    {
        lens: '8mm',
        degrees: '約 38°',
        scene: '遠一點的門口、車道、圍牆或周界',
        feel: '畫面較窄，聚焦重點區域',
        advice: '常見於需要把遠處主體拉近的案場。',
    },
    {
        lens: '12mm+',
        degrees: '約 27° 以下',
        scene: '遠距離辨識、停車場深處、特殊重點點位',
        feel: '範圍更小，但主體更大',
        advice: '通常要連解析度、安裝高度與實際目標一起評估。',
    },
];

export const CCTV_FOCAL_EXAMPLES = [
    {
        title: '店面入口',
        inputs: '安裝距離 4 公尺 / 想看 7 公尺寬',
        answer: '大約會落在 3.1mm，實務上多半先比 2.8mm 與 4mm。',
    },
    {
        title: '辦公室櫃台',
        inputs: '安裝距離 3 公尺 / 想看 4 公尺寬',
        answer: '大約會落在 4.0mm，通常可先看 4mm。',
    },
    {
        title: '走道或出入口',
        inputs: '安裝距離 6 公尺 / 想看 4 公尺寬',
        answer: '大約會落在 8.1mm，實務上會先從 8mm 開始比較。',
    },
];

export const CCTV_FOCAL_HOW_TO_STEPS = [
    {
        name: '量安裝距離',
        text: '先抓攝影機到目標區域的大約距離，通常以鏡頭到要看的主畫面中心點來估算。',
    },
    {
        name: '決定想看的寬度',
        text: '再想清楚你要拍多寬，是整個門面、單一出入口、走道，還是只想聚焦櫃台與人臉。',
    },
    {
        name: '比對常見鏡頭焦距',
        text: '用試算結果對照 2.8mm、4mm、6mm、8mm 等常見焦距，再依畫面要廣一點或聚焦一點做取捨。',
    },
];
