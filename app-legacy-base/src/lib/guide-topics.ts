export type GuideTopicConfig = {
  key: string;
  label: string;
  description: string;
  accent: string;
};

export const GUIDE_TOPIC_CONFIGS: GuideTopicConfig[] = [
  {
    key: 'access-control',
    label: '門禁系統',
    description: '採購、升級、權限、施工與維運重點',
    accent: 'from-amber-100 to-orange-50 text-amber-950',
  },
  {
    key: 'intercom',
    label: '對講與門口機',
    description: '社區、透天與企業場景的對講規劃與整合判斷',
    accent: 'from-sky-100 to-cyan-50 text-sky-950',
  },
  {
    key: 'phone-system',
    label: '電話總機',
    description: '雲端、實體、SIP 與企業通訊架構的評估重點',
    accent: 'from-emerald-100 to-teal-50 text-emerald-950',
  },
  {
    key: 'security',
    label: '監視與安防',
    description: '錄影、事件追蹤、整合管理與安防規劃',
    accent: 'from-violet-100 to-fuchsia-50 text-violet-950',
  },
  {
    key: 'compliance',
    label: '合規與案例',
    description: 'NDAA、資安、導入紀錄與內部溝通素材',
    accent: 'from-slate-200 to-slate-50 text-slate-900',
  },
];

const TOPIC_MATCHERS: Array<{ key: string; matches: string[] }> = [
  { key: 'access-control', matches: ['門禁', 'access', 'card', 'reader'] },
  { key: 'intercom', matches: ['對講', '門口機', 'intercom', 'akuvox'] },
  { key: 'phone-system', matches: ['電話總機', '總機', 'pbx', 'sip', 'telecom'] },
  { key: 'security', matches: ['監視', '安防', '錄影', 'cctv', 'security'] },
  { key: 'compliance', matches: ['合規', '資通', 'ndaa', '案例', 'compliance'] },
];

export function getGuideTopicKey(topic: string | null) {
  if (!topic) return null;
  const value = topic.toLowerCase();
  const matched = TOPIC_MATCHERS.find((item) => item.matches.some((token) => value.includes(token.toLowerCase())));
  return matched?.key ?? null;
}

export function getGuideTopicConfig(topicKey: string | null) {
  if (!topicKey) return null;
  return GUIDE_TOPIC_CONFIGS.find((item) => item.key === topicKey) || null;
}
