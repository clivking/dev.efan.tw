export type ServiceEntity = {
  slug: string;
  name: string;
  shortName: string;
  href: string;
};

export type LocationEntity = {
  slug: string;
  name: string;
  city: string;
  district?: string;
  href: string;
};

export type FaqEntity = {
  question: string;
  answer: string;
};

const SERVICE_ENTITIES: Record<string, ServiceEntity> = {
  'access-control': {
    slug: 'access-control',
    name: '門禁系統',
    shortName: '門禁',
    href: '/services/access-control',
  },
  cctv: {
    slug: 'cctv',
    name: '監視錄影',
    shortName: '監視',
    href: '/services/cctv',
  },
  'phone-system': {
    slug: 'phone-system',
    name: '電話總機',
    shortName: '總機',
    href: '/services/phone-system',
  },
  attendance: {
    slug: 'attendance',
    name: '考勤薪資',
    shortName: '考勤',
    href: '/services/attendance',
  },
  integration: {
    slug: 'integration',
    name: '弱電整合',
    shortName: '整合',
    href: '/services/integration',
  },
};

const LOCATION_ENTITIES: Record<string, LocationEntity> = {
  'taipei-access-control': {
    slug: 'taipei-access-control',
    name: '台北門禁系統',
    city: '台北市',
    href: '/locations/taipei-access-control',
  },
  'daan-access-control': {
    slug: 'daan-access-control',
    name: '大安區門禁系統',
    city: '台北市',
    district: '大安區',
    href: '/locations/daan-access-control',
  },
  'neihu-access-control': {
    slug: 'neihu-access-control',
    name: '內湖區門禁系統',
    city: '台北市',
    district: '內湖區',
    href: '/locations/neihu-access-control',
  },
  'taipei-pbx-system': {
    slug: 'taipei-pbx-system',
    name: '台北電話總機系統',
    city: '台北市',
    href: '/locations/taipei-pbx-system',
  },
};

const LOCATION_FAQ_ENTITIES: Record<string, FaqEntity[]> = {
  'taipei-access-control': [
    {
      question: '台北市門禁系統規劃時要先看哪些條件？',
      answer:
        '通常會先確認門片材質、鎖具型式、弱電線路、出入口數量與管理需求，再決定是採用刷卡、密碼、人臉辨識或手機開門架構。',
    },
    {
      question: '門禁系統可以搭配監視器與對講機一起規劃嗎？',
      answer:
        '可以。若一開始就把門禁、對講、監視與訪客流程一起規劃，後續管理會更一致，也能減少重複施工與系統彼此不相容的問題。',
    },
    {
      question: '台北市老舊辦公室也能升級門禁嗎？',
      answer:
        '可以，重點是現場評估門框、管線與供電條件。即使是舊大樓或既有裝潢空間，多半仍能找到兼顧美觀與實用性的施工做法。',
    },
  ],
  'daan-access-control': [
    {
      question: '大安區辦公室適合哪一種門禁系統？',
      answer:
        '若是中小型辦公室，常見會採用卡片、密碼或手機開門的門禁系統；若有訪客管理、跨樓層權限或與總機整合需求，則建議採用可擴充的網路型門禁架構。',
    },
    {
      question: '老舊大樓或狹小玄關也能安裝門禁嗎？',
      answer:
        '可以。現場會先評估門框、弱電管線、門片材質與供電條件，再決定採用磁力鎖、電鎖、門口機或無線按鍵等做法，降低施工干擾。',
    },
    {
      question: '門禁系統可以和對講機或監視系統整合嗎？',
      answer:
        '可以，常見整合方式包含門口機與室內對講、手機遠端開門、監視畫面聯動與事件記錄查詢，讓出入口管理和日常營運流程更一致。',
    },
  ],
  'neihu-access-control': [
    {
      question: '內湖辦公室門禁規劃時最常見的需求是什麼？',
      answer:
        '常見需求包含多部門權限管理、訪客報到、手機開門、門禁紀錄查詢，以及與總機或監視系統聯動，方便日常管理與稽核。',
    },
    {
      question: '多樓層或多入口的空間適合哪一種門禁架構？',
      answer:
        '若同時有多個門點與跨樓層管理需求，建議採用網路型門禁架構，方便統一設定權限、集中查詢事件紀錄，後續擴充也較容易。',
    },
    {
      question: '門禁系統能和 HR 或訪客管理流程搭配嗎？',
      answer:
        '可以，常見做法是把員工權限、訪客放行與報到紀錄流程整合起來，讓行政、總務與資訊管理更順暢。',
    },
  ],
  'taipei-pbx-system': [
    {
      question: '台北市企業更新總機系統時，通常會遇到哪些問題？',
      answer:
        '常見問題包含分機架構混亂、舊設備難維修、搬遷後佈線不符需求，以及總機與門口機、客服流程或網路環境難以整合。',
    },
    {
      question: '傳統總機可以升級成 IP PBX 嗎？',
      answer:
        '可以，實際做法要看既有分機、網路環境與通話需求。有些場域適合逐步過渡，有些則適合直接重整架構，再搭配語音閘道或新分機設備。',
    },
    {
      question: '總機系統可以和門口機或客服流程整合嗎？',
      answer:
        '可以，常見整合方式包含門口機來電轉接、櫃台與部門分流、通話錄音、分機群組與轉接規則設定，讓對外聯絡更順暢。',
    },
  ],
};

const SOLUTION_FAQ_ENTITIES: Record<string, FaqEntity[]> = {
  'taipei-cctv-system': [
    {
      question: '為什麼辦公室不建議使用一般消費型 Wi-Fi 攝影機？',
      answer:
        '企業場域更在意穩定錄影、帳號權限與資料保存，因此通常需要 NVR、固定網路與更可控的設備管理。',
    },
    {
      question: '停電時監視器還能錄影嗎？',
      answer:
        '若有搭配 UPS、不斷電系統與正確的錄影架構設計，停電時仍可維持一段時間的監控與錄影。',
    },
  ],
  'taipei-office-access-control': [
    {
      question: '台北老舊商辦能升級到新式門禁系統嗎？',
      answer:
        '可以，但要先確認既有線路、門框條件與電源配置，再決定是否採用人臉辨識、讀卡或混合式架構。',
    },
    {
      question: '只有一個門點，也值得做完整規劃嗎？',
      answer:
        '值得，因為權限邏輯、記錄保存與未來擴充通常都從第一個門點開始，前期規劃正確能避免後續重工。',
    },
  ],
};

export function getServiceEntity(slug: string) {
  return SERVICE_ENTITIES[slug] || null;
}

export function getServiceEntitiesBySlugs(slugs: string[]) {
  return slugs
    .map((slug) => getServiceEntity(slug))
    .filter((item): item is ServiceEntity => Boolean(item));
}

export function getServiceLabel(slug: string) {
  return getServiceEntity(slug)?.name || slug;
}

export function getLocationEntity(slug: string) {
  return LOCATION_ENTITIES[slug] || null;
}

export function getLocationEntities() {
  return Object.values(LOCATION_ENTITIES);
}

export function getLocationFaqEntities(slug: string) {
  return LOCATION_FAQ_ENTITIES[slug] || [];
}

export function getSolutionFaqEntities(slug: string) {
  return SOLUTION_FAQ_ENTITIES[slug] || [];
}
