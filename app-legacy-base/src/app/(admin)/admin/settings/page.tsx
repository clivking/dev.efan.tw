'use client';

import Image from 'next/image';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import SeoLogTab from './SeoLogTab';
import UsersTab from './UsersTab';

type Setting = {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
};

type GroupedSettings = Record<string, Setting[]>;

type UsageBucket = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  messageCount: number;
};

type AIUsage = {
  today: UsageBucket;
  thisMonth: UsageBucket;
  lastMonth: UsageBucket;
  lifetime: UsageBucket;
  lastEventAt: string | null;
};

type ActionMessage = { type: 'success' | 'error'; text: string };

type ModelOption = {
  id: string;
  name: string;
  description?: string;
  pricing?: { inputPer1M: number; outputPer1M: number } | null;
};

type WebhookInfo = {
  ok?: boolean;
  result?: {
    url?: string;
    pending_update_count?: number;
    last_error_message?: string;
    has_custom_certificate?: boolean;
  };
  error?: string;
};

type AuditLog = {
  id: string;
  action: string;
  tableName: string;
  recordLabel: string | null;
  createdAt: string;
  user?: { name?: string | null; username?: string | null } | null;
};

const HIDDEN_KEYS = new Set([
  'ai_api_key', 'ai_model', 'ai_claude_api_key', 'ai_claude_model', 'remind_unviewed_days', 'remind_viewed_unsigned_days',
  'remind_warranty_before_days', 'remind_unpaid_days', 'transport_free_km',
  'transport_per_km_unit', 'transport_per_unit_fee', 'transport_base_address',
  'hide_empty_customer_fields', 'show_internal_note_default', 'default_warranty_months',
  'google_maps_api_key', 'smtp_config', 'audit_retention_days', 'allow_edit_signed_quote',
  'allow_edit_paid_quote', 'dashboard_recent_limit', 'default_variant_names',
  'default_recommended', 'signature_required_fields', 'signature_canvas_width',
  'signature_canvas_height', 'telegram_notify_events', 'warranty_start_event',
]);

const NAV = [
  { id: 'company', label: '公司資訊', categories: ['company'] },
  { id: 'quote', label: '報價設定', categories: ['quote', 'variant'] },
  { id: 'display', label: '顯示與文件', categories: ['ui', 'document', 'dashboard'] },
  { id: 'ai', label: 'AI 智能', categories: ['ai'] },
  { id: 'notify', label: '通知設定', categories: ['telegram', 'email'] },
  { id: 'security', label: '安全與 API', categories: ['security', 'api'] },
  { id: 'seo', label: 'SEO', categories: ['seo'] },
  { id: 'users', label: '使用者', categories: ['users'] },
  { id: 'audit', label: '稽核紀錄', categories: ['audit'] },
] as const;

const LABELS: Record<string, string> = {
  company: '公司資訊',
  quote: '報價設定',
  variant: '版本設定',
  ui: 'UI',
  document: '文件設定',
  dashboard: '儀表板',
  telegram: 'Telegram',
  email: 'Email',
  security: '安全設定',
  api: 'API',
  ai: 'AI 智能',
  seo: 'SEO',
  audit: '稽核紀錄',
};

const QUOTE_STATUS_OPTIONS = ['draft', 'confirmed', 'sent', 'signed', 'construction', 'completed', 'paid', 'closed'];
const BUSINESS_DAY_OPTIONS = [
  { value: 1, label: '週一' },
  { value: 2, label: '週二' },
  { value: 3, label: '週三' },
  { value: 4, label: '週四' },
  { value: 5, label: '週五' },
  { value: 6, label: '週六' },
  { value: 7, label: '週日' },
];
const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
];

const MODEL_SETTING_PROVIDER: Record<string, 'gemini' | 'openai'> = {
  ai_gemini_model: 'gemini',
  ai_openai_model: 'openai',
};

const TESTABLE_AI_KEY_FIELDS = new Set(['ai_gemini_api_key', 'ai_openai_api_key']);

const IMAGE_KEYS = new Set([
  'company_logo_url', 'pdf_logo_url', 'company_stamp_url', 'delivery_stamp_url',
  'invoice_stamp_url', 'receipt_stamp_url', 'warranty_stamp_url', 'company_favicon_url',
]);

const ENCRYPTED_MASK = '••••••••';

function normalizeMaskedValue(value: string) {
  return value === ENCRYPTED_MASK ? '' : value;
}

const EMPTY_USAGE: UsageBucket = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
  messageCount: 0,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GroupedSettings | null>(null);
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [models, setModels] = useState<Record<string, ModelOption[]>>({ gemini: [], openai: [] });
  const [modelLoading, setModelLoading] = useState<Record<string, boolean>>({});
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('company');
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    void loadInitial();
    const hash = window.location.hash.replace('#', '');
    if (hash) setTab(hash);
  }, []);

  const handleTabSideEffects = useEffectEvent(() => {
    if (tab === 'ai') {
      const provider = getCurrentValue('ai_provider') || 'gemini';
      void fetchModels(provider as 'gemini' | 'openai');
    }
    if (tab === 'notify') {
      void fetchWebhookInfo();
    }
    if (tab === 'audit') {
      void fetchAuditLogs();
    }
  });

  useEffect(() => {
    handleTabSideEffects();
  }, [tab]);

  const current = NAV.find((item) => item.id === tab) || NAV[0];
  const hasDirtyValues = Object.keys(dirty).length > 0;
  const currentProvider = (getCurrentValue('ai_provider') || 'gemini') as 'gemini' | 'openai';

  function getOriginalValue(key: string) {
    if (!settings) return '';
    for (const items of Object.values(settings)) {
      const found = items.find((item) => item.key === key);
      if (found) return found.value;
    }
    return '';
  }

  function getCurrentValue(key: string) {
    return dirty[key] ?? getOriginalValue(key);
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const [settingsRes, usageRes] = await Promise.all([fetch('/api/settings'), fetch('/api/ai/usage')]);

      if (settingsRes.ok) {
        const raw = await settingsRes.json() as GroupedSettings;
        const filtered: GroupedSettings = {};
        for (const [category, items] of Object.entries(raw)) {
          filtered[category] = items.filter((item) => !HIDDEN_KEYS.has(item.key));
        }
        setSettings(filtered);
      }

      if (usageRes.ok) {
        setUsage(await usageRes.json());
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: '無法載入系統設定。' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchModels(provider: 'gemini' | 'openai') {
    if (modelLoading[provider]) return;
    setModelLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch(`/api/ai/models?provider=${provider}`);
      const data = await res.json().catch(() => ({ models: [] }));
      if (!res.ok) throw new Error(data.error || `無法載入 ${provider} 模型清單。`);
      setModels((prev) => ({ ...prev, [provider]: data.models || [] }));
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error?.message || '無法載入 AI 模型清單。' });
    } finally {
      setModelLoading((prev) => ({ ...prev, [provider]: false }));
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch('/api/ai/usage');
      if (res.ok) setUsage(await res.json());
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchWebhookInfo() {
    try {
      const res = await fetch('/api/telegram/setup-webhook');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '無法載入 Telegram webhook 資訊。');
      setWebhookInfo(data);
    } catch (error: any) {
      setWebhookInfo({ error: error?.message || '無法載入 Telegram webhook 資訊。' });
    }
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/audit?limit=20');
      const data = await res.json().catch(() => ({ logs: [] }));
      if (!res.ok) throw new Error(data.error || '無法載入稽核紀錄。');
      setAuditLogs(data.logs || []);
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error?.message || '無法載入稽核紀錄。' });
    } finally {
      setAuditLoading(false);
    }
  }

  function updateValue(key: string, value: string) {
    const original = getOriginalValue(key);
    setDirty((prev) => {
      const next = { ...prev };
      if (value === original) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  async function save() {
    if (!hasDirtyValues) return;
    setSaving(true);
    setMessage(null);
    try {
      const entries = Object.entries(dirty);
      const results = await Promise.all(entries.map(async ([key, value]) => {
        const res = await fetch(`/api/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `無法儲存 ${key}。`);
        }
        return key;
      }));

      setDirty({});
      setMessage({ type: 'success', text: `\u5df2\u5132\u5b58 ${results.length} \u9805\u8a2d\u5b9a\u8b8a\u66f4\u3002` });
      await loadInitial();
      if (results.some((key) => key.startsWith('ai_'))) void fetchModels(currentProvider);
      if (tab === 'notify') void fetchWebhookInfo();
      if (tab === 'audit') void fetchAuditLogs();
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error?.message || '\u7121\u6cd5\u5132\u5b58\u8a2d\u5b9a\u3002' });
    } finally {
      setSaving(false);
    }
  }

  async function runAction(actionKey: string, work: () => Promise<string>) {
    setBusyAction(actionKey);
    setMessage(null);
    try {
      const text = await work();
      setMessage({ type: 'success', text });
      await fetchUsage();
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error?.message || '操作失敗。' });
    } finally {
      setBusyAction(null);
    }
  }

  async function uploadImage(settingKey: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'setting');
    formData.append('entityId', settingKey);
    formData.append('folder', 'settings');

    const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '\u5716\u7247\u4e0a\u50b3\u5931\u6557\u3002');
    updateValue(settingKey, data.url || '');
  }

  const usageCards = useMemo(() => {
    const data = usage || { today: EMPTY_USAGE, thisMonth: EMPTY_USAGE, lastMonth: EMPTY_USAGE, lifetime: EMPTY_USAGE, lastEventAt: null };
    return [
      { title: '\u4eca\u65e5', bucket: data.today, tone: 'blue' },
      { title: '\u672c\u6708', bucket: data.thisMonth, tone: 'emerald' },
      { title: '\u4e0a\u6708', bucket: data.lastMonth, tone: 'gray' },
      { title: '\u7d2f\u7a4d', bucket: data.lifetime, tone: 'amber' },
    ] as const;
  }, [usage]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-efan-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-efan-primary">{'\u7cfb\u7d71\u8a2d\u5b9a'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          已整理設定頁結構，並補回常用工具與 AI 用量追蹤。
        </p>
      </div>

      {message && (
        <div className={`rounded-2xl border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                window.location.hash = item.id;
              }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm ${tab === item.id ? 'bg-efan-accent font-bold text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <span>{item.label}</span>
              {item.categories.some((category) => settings?.[category]?.some((row) => dirty[row.key] !== undefined)) && <span className="h-2 w-2 rounded-full bg-orange-400" />}
            </button>
          ))}
        </div>

        <div className="space-y-5 lg:col-span-3">
          <div className="min-h-[500px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {tab === 'users' ? (
              <Section title="使用者"><UsersTab /></Section>
            ) : tab === 'seo' ? (
              <SeoLogTab settingsContent={<SettingsList categories={[...current.categories]} settings={settings} dirty={dirty} models={models} modelLoading={modelLoading} onRefreshModels={fetchModels} onChange={updateValue} onUploadImage={uploadImage} busyAction={busyAction} onRunAction={runAction} getCurrentValue={getCurrentValue} />} />
            ) : tab === 'audit' ? (
              <Section title="稽核紀錄"><AuditPanel logs={auditLogs} loading={auditLoading} onRefresh={fetchAuditLogs} /></Section>
            ) : tab === 'ai' ? (
              <Section title="AI 智能">
                <UsagePanel usageCards={usageCards} lastEventAt={usage?.lastEventAt || null} />
                <ActionGrid
                  actions={[
                    {
                      key: 'load-models',
                      label: `\u8f09\u5165 ${currentProvider} \u6a21\u578b`,
                      description: '\u91cd\u65b0\u6574\u7406\u76ee\u524d\u4f9b\u61c9\u5546\u7684\u6a21\u578b\u6e05\u55ae\u3002',
                      busy: busyAction === 'load-models' || !!modelLoading[currentProvider],
                      onClick: () => runAction('load-models', async () => {
                        await fetchModels(currentProvider);
                        return `\u5df2\u8f09\u5165 ${currentProvider} \u6a21\u578b\u6e05\u55ae\u3002`;
                      }),
                    },
                    ...PROVIDER_OPTIONS.map((provider) => ({
                      key: `test-${provider.value}`,
                      label: `\u6e2c\u8a66 ${provider.label}`,
                      description: '\u9a57\u8b49\u4f9b\u61c9\u5546\u91d1\u9470\uff0c\u4e26\u8a18\u9304\u4e00\u7b46 AI \u7528\u91cf\u4e8b\u4ef6\u3002',
                      busy: busyAction === `test-${provider.value}`,
                      onClick: () => runAction(`test-${provider.value}`, async () => {
                        const modelId = getCurrentValue(`ai_${provider.value}_model`);
                        const apiKey = normalizeMaskedValue(getCurrentValue(`ai_${provider.value}_api_key`));
                        const res = await fetch('/api/ai/test-connection', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ provider: provider.value, apiKey, modelId }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data.error || `${provider.label} 測試失敗。`);
                        return data.message || `${provider.label} 連線成功。`;
                      }),
                    })),
                  ]}
                />
                <div className="mt-8">
                  <SettingsList categories={['ai']} settings={settings} dirty={dirty} models={models} modelLoading={modelLoading} onRefreshModels={fetchModels} onChange={updateValue} onUploadImage={uploadImage} busyAction={busyAction} onRunAction={runAction} getCurrentValue={getCurrentValue} />
                </div>
              </Section>
            ) : tab === 'notify' ? (
              <Section title={'\u901a\u77e5\u8a2d\u5b9a'}>
                <ActionGrid
                  actions={[
                    { key: 'test-bot-token', label: '\u6e2c\u8a66 bot token', description: '\u76f4\u63a5\u5411 Telegram \u9a57\u8b49 bot token \u662f\u5426\u6709\u6548\u3002', busy: busyAction === 'test-bot-token', onClick: () => runAction('test-bot-token', async () => { const res = await fetch('/api/notifications/test-bot-token', { method: 'POST' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Bot token \u9a57\u8b49\u5931\u6557\u3002'); return data.message || 'Telegram bot token \u9a57\u8b49\u6210\u529f\u3002'; }) },
                    { key: 'setup-webhook', label: '\u8a3b\u518a webhook', description: '\u8a3b\u518a\u76ee\u524d\u7684 Telegram webhook \u7db2\u5740\u3002', busy: busyAction === 'setup-webhook', onClick: () => runAction('setup-webhook', async () => { const res = await fetch('/api/telegram/setup-webhook', { method: 'POST' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Webhook \u8a3b\u518a\u5931\u6557\u3002'); await fetchWebhookInfo(); return data.message || 'Telegram webhook \u5df2\u8a3b\u518a\u3002'; }) },
                    { key: 'refresh-webhook', label: '\u91cd\u65b0\u6574\u7406 webhook', description: '\u8b80\u53d6\u76ee\u524d\u7684 Telegram webhook \u72c0\u614b\u3002', busy: busyAction === 'refresh-webhook', onClick: () => runAction('refresh-webhook', async () => { await fetchWebhookInfo(); return 'Telegram webhook \u8cc7\u8a0a\u5df2\u66f4\u65b0\u3002'; }) },
                    { key: 'test-main-chat', label: '\u6e2c\u8a66\u4e3b\u901a\u77e5\u7fa4', description: '\u9001\u4e00\u5247 Telegram \u6e2c\u8a66\u8a0a\u606f\u5230\u4e3b\u901a\u77e5\u7fa4\u7d44\u3002', busy: busyAction === 'test-main-chat', onClick: () => runAction('test-main-chat', async () => { const res = await fetch('/api/notifications/test-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatIdSettingKey: 'telegram_chat_id' }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Telegram \u6e2c\u8a66\u8a0a\u606f\u767c\u9001\u5931\u6557\u3002'); return data.message || '\u4e3b\u901a\u77e5\u7fa4\u7d44\u6e2c\u8a66\u8a0a\u606f\u5df2\u9001\u51fa\u3002'; }) },
                    { key: 'test-cs-chat', label: '\u6e2c\u8a66\u5ba2\u670d\u7fa4', description: '\u9001\u4e00\u5247 Telegram \u6e2c\u8a66\u8a0a\u606f\u5230\u5ba2\u670d\u901a\u77e5\u7fa4\u7d44\u3002', busy: busyAction === 'test-cs-chat', onClick: () => runAction('test-cs-chat', async () => { const res = await fetch('/api/notifications/test-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatIdSettingKey: 'telegram_chat_id_customer_service' }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Telegram \u6e2c\u8a66\u8a0a\u606f\u767c\u9001\u5931\u6557\u3002'); return data.message || '\u5ba2\u670d\u901a\u77e5\u7fa4\u7d44\u6e2c\u8a66\u8a0a\u606f\u5df2\u9001\u51fa\u3002'; }) },
                    { key: 'test-email', label: '\u5bc4\u9001\u6e2c\u8a66\u4fe1', description: '\u78ba\u8a8d\u76ee\u524d SMTP \u8a2d\u5b9a\u662f\u5426\u80fd\u6210\u529f\u5bc4\u4fe1\u3002', busy: busyAction === 'test-email', onClick: () => runAction('test-email', async () => { const res = await fetch('/api/settings/test-email', { method: 'POST' }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || '\u6e2c\u8a66\u4fe1\u5bc4\u9001\u5931\u6557\u3002'); return data.message || '\u6e2c\u8a66\u4fe1\u5df2\u5bc4\u51fa\u3002'; }) },
                  ]}
                />
                <WebhookCard info={webhookInfo} />
                <div className="mt-8">
                  <SettingsList categories={['telegram', 'email']} settings={settings} dirty={dirty} models={models} modelLoading={modelLoading} onRefreshModels={fetchModels} onChange={updateValue} onUploadImage={uploadImage} busyAction={busyAction} onRunAction={runAction} getCurrentValue={getCurrentValue} />
                </div>
              </Section>
            ) : (
              <SettingsList categories={[...current.categories]} settings={settings} dirty={dirty} models={models} modelLoading={modelLoading} onRefreshModels={fetchModels} onChange={updateValue} onUploadImage={uploadImage} busyAction={busyAction} onRunAction={runAction} getCurrentValue={getCurrentValue} />
            )}
          </div>

          <div className={`flex items-center justify-between rounded-2xl border p-5 ${hasDirtyValues ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-gray-50/30'}`}>
            <div className="text-sm text-gray-600">{hasDirtyValues ? `\u5c1a\u6709 ${Object.keys(dirty).length} \u9805\u672a\u5132\u5b58\u8b8a\u66f4\u3002` : '\u76ee\u524d\u6c92\u6709\u5f85\u5132\u5b58\u8b8a\u66f4\u3002'}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDirty({})} disabled={!hasDirtyValues} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500 disabled:opacity-30">{'\u53d6\u6d88'}</button>
              <button type="button" onClick={save} disabled={!hasDirtyValues || saving} className="rounded-xl bg-efan-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-30">{saving ? '\u5132\u5b58\u4e2d...' : '\u5132\u5b58\u8a2d\u5b9a'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 md:p-8">
      <h2 className="mb-6 border-l-4 border-efan-primary pl-3 text-xl font-bold text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

function UsagePanel({
  usageCards,
  lastEventAt,
}: {
  usageCards: ReadonlyArray<{ title: string; bucket: UsageBucket; tone: string }>;
  lastEventAt: string | null;
}) {
  const toTWD = (usd: number) => `NT$${(usd * 32.5).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {usageCards.map(({ title, bucket, tone }) => {
          const palette = tone === 'blue'
            ? ['from-blue-50 to-blue-100/50 border-blue-100', 'text-blue-700', 'text-blue-500', 'text-blue-400']
            : tone === 'emerald'
              ? ['from-emerald-50 to-emerald-100/50 border-emerald-100', 'text-emerald-700', 'text-emerald-500', 'text-emerald-400']
              : tone === 'amber'
                ? ['from-amber-50 to-amber-100/50 border-amber-100', 'text-amber-700', 'text-amber-500', 'text-amber-400']
                : ['from-gray-50 to-gray-100/50 border-gray-100', 'text-gray-700', 'text-gray-500', 'text-gray-400'];

          return (
            <div key={title} className={`rounded-2xl border bg-gradient-to-br p-5 ${palette[0]}`}>
              <div className={`mb-1 text-xs font-black uppercase tracking-widest ${palette[3]}`}>{title}</div>
              <div className={`text-2xl font-black ${palette[1]}`}>
                {bucket.totalTokens.toLocaleString()} <span className={`text-xs ${palette[3]}`}>tokens</span>
              </div>
              <div className={`text-sm font-bold ${palette[2]}`}>{toTWD(bucket.estimatedCost)}</div>
              <div className={`mt-1 text-xs ${palette[3]}`}>{bucket.messageCount} 筆事件</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-700">
        這裡會統一追蹤聊天回覆、背景抽取，以及後台連線測試產生的 AI 用量。
        {lastEventAt && <span className="ml-2 text-blue-500">最近一筆：{new Date(lastEventAt).toLocaleString()}</span>}
      </div>
    </div>
  );
}

function ActionGrid({
  actions,
}: {
  actions: Array<{ key: string; label: string; description: string; busy: boolean; onClick: () => void }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          disabled={action.busy}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-efan-primary/20 hover:bg-white disabled:opacity-50"
        >
          <div className="text-sm font-bold text-gray-800">{action.busy ? '\u8655\u7406\u4e2d...' : action.label}</div>
          <div className="mt-1 text-xs leading-5 text-gray-500">{action.description}</div>
        </button>
      ))}
    </div>
  );
}

function WebhookCard({ info }: { info: WebhookInfo | null }) {
  if (!info) return null;
  const result = info.result;

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
      <div className="text-sm font-bold text-gray-800">Telegram webhook 狀態</div>
      {info.error ? (
        <div className="mt-2 text-sm text-red-600">{info.error}</div>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div>{'URL\uff1a'}{result?.url || '\u672a\u8a2d\u5b9a'}</div>
          <div>{'\u5f85\u8655\u7406\u66f4\u65b0\uff1a'}{result?.pending_update_count ?? 0}</div>
          <div>{'\u81ea\u8a02\u6191\u8b49\uff1a'}{result?.has_custom_certificate ? '\u662f' : '\u5426'}</div>
          {result?.last_error_message && <div className="text-red-600">{'\u6700\u8fd1\u932f\u8aa4\uff1a'}{result.last_error_message}</div>}
        </div>
      )}
    </div>
  );
}

function AuditPanel({
  logs,
  loading,
  onRefresh,
}: {
  logs: AuditLog[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{'\u6700\u8fd1 20 \u7b46\u7a3d\u6838\u7d00\u9304\u3002'}</div>
        <button type="button" onClick={() => { void onRefresh(); }} disabled={loading} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50">
          {loading ? '\u66f4\u65b0\u4e2d...' : '\u91cd\u65b0\u6574\u7406'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{'\u6642\u9593'}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{'\u4f7f\u7528\u8005'}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{'\u52d5\u4f5c'}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{'\u8cc7\u6599\u8868'}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500">{'\u7d00\u9304'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{loading ? '載入稽核紀錄中...' : '目前沒有稽核紀錄。'}</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{log.user?.name || log.user?.username || '系統'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{log.action}</td>
                  <td className="px-4 py-3 text-gray-500">{log.tableName}</td>
                  <td className="px-4 py-3 text-gray-500">{log.recordLabel || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsList({
  categories,
  settings,
  dirty,
  models,
  modelLoading,
  onRefreshModels,
  onChange,
  onUploadImage,
  busyAction,
  onRunAction,
  getCurrentValue,
}: {
  categories: string[];
  settings: GroupedSettings | null;
  dirty: Record<string, string>;
  models: Record<string, ModelOption[]>;
  modelLoading: Record<string, boolean>;
  onRefreshModels: (provider: 'gemini' | 'openai') => Promise<void>;
  onChange: (key: string, value: string) => void;
  onUploadImage: (settingKey: string, file: File) => Promise<void>;
  busyAction: string | null;
  onRunAction: (key: string, work: () => Promise<string>) => Promise<void>;
  getCurrentValue: (key: string) => string;
}) {
  return (
    <div className="flex flex-col">
      {categories.map((category, index) => {
        const items = settings?.[category];
        if (!items?.length) return null;

        return (
          <div key={category}>
            {index > 0 && <div className="border-t border-gray-100" />}
            {categories.length > 1 && (
              <div className="px-6 pb-2 pt-6 md:px-8">
                <h3 className="border-l-4 border-efan-primary pl-3 text-lg font-bold text-gray-700">{LABELS[category] || category}</h3>
              </div>
            )}
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <SettingRow
                  key={item.key}
                  item={item}
                  value={dirty[item.key] ?? item.value}
                  dirty={dirty[item.key] !== undefined}
                  modelOptions={MODEL_SETTING_PROVIDER[item.key] ? models[MODEL_SETTING_PROVIDER[item.key]] || [] : []}
                  modelLoading={MODEL_SETTING_PROVIDER[item.key] ? !!modelLoading[MODEL_SETTING_PROVIDER[item.key]] : false}
                  onRefreshModels={MODEL_SETTING_PROVIDER[item.key] ? () => onRefreshModels(MODEL_SETTING_PROVIDER[item.key]) : undefined}
                  onChange={(value) => onChange(item.key, value)}
                  onUploadImage={onUploadImage}
                  busyAction={busyAction}
                  onRunAction={onRunAction}
                  getCurrentValue={getCurrentValue}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingRow({
  item,
  value,
  dirty,
  modelOptions,
  modelLoading,
  onRefreshModels,
  onChange,
  onUploadImage,
  busyAction,
  onRunAction,
  getCurrentValue,
}: {
  item: Setting;
  value: string;
  dirty: boolean;
  modelOptions: ModelOption[];
  modelLoading: boolean;
  onRefreshModels?: () => Promise<void>;
  onChange: (value: string) => void;
  onUploadImage: (settingKey: string, file: File) => Promise<void>;
  busyAction: string | null;
  onRunAction: (key: string, work: () => Promise<string>) => Promise<void>;
  getCurrentValue: (key: string) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMaskedEncrypted = item.type === 'encrypted' && !dirty;
  const inputValue = isMaskedEncrypted ? '' : value;
  const isImageField = IMAGE_KEYS.has(item.key);
  const isModelField = !!MODEL_SETTING_PROVIDER[item.key];
  const actionKey = `test-${item.key}`;

  if (item.key === 'allow_delete_status') {
    const selected = (() => {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    return (
      <div className={`border-l-4 px-6 py-5 md:px-8 ${dirty ? 'border-orange-400 bg-orange-50/50' : 'border-transparent hover:bg-gray-50/30'}`}>
        <div className="mb-2 text-sm font-semibold text-gray-700">{item.description || item.key}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {QUOTE_STATUS_OPTIONS.map((status) => (
            <label key={status} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm ${selected.includes(status) ? 'border-efan-primary/30 bg-efan-primary/10 text-efan-primary' : 'border-gray-100 bg-white text-gray-500'}`}>
              <input
                type="checkbox"
                checked={selected.includes(status)}
                onChange={(event) => {
                  const next = event.target.checked ? [...selected, status] : selected.filter((entry: string) => entry !== status);
                  onChange(JSON.stringify(next));
                }}
                className="h-4 w-4 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
              />
              <span>{status}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (item.key === 'business_days') {
    const selected = (() => {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed
              .map((entry) => Number(entry))
              .filter((entry) => Number.isInteger(entry) && entry >= 1 && entry <= 7)
          : [];
      } catch {
        return [];
      }
    })();

    return (
      <div className={`border-l-4 px-6 py-5 md:px-8 ${dirty ? 'border-orange-400 bg-orange-50/50' : 'border-transparent hover:bg-gray-50/30'}`}>
        <div className="mb-2 text-sm font-semibold text-gray-700">{item.description || item.key}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BUSINESS_DAY_OPTIONS.map((day) => (
            <label key={day.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm ${selected.includes(day.value) ? 'border-efan-primary/30 bg-efan-primary/10 text-efan-primary' : 'border-gray-100 bg-white text-gray-500'}`}>
              <input
                type="checkbox"
                checked={selected.includes(day.value)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, day.value]
                    : selected.filter((entry) => entry !== day.value);
                  onChange(JSON.stringify([...next].sort((a, b) => a - b)));
                }}
                className="h-4 w-4 rounded border-gray-300 text-efan-primary focus:ring-efan-primary"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border-l-4 px-6 py-5 md:px-8 ${dirty ? 'border-orange-400 bg-orange-50/50' : 'border-transparent hover:bg-gray-50/30'}`}>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="space-y-1 md:w-2/5">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
            {item.description || item.key}
            {dirty ? <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">已修改</span> : !item.value ? <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">未設定</span> : <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">已就緒</span>}
          </h3>
          <div className="text-[10px] font-mono text-gray-300">{item.key}</div>
        </div>

        <div className="flex-1 space-y-3">
          {renderInput()}

          {isImageField && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              {value ? (
                <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-3">
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gray-100">
                    <Image src={value} alt={item.key} fill className="object-contain" unoptimized />
                  </div>
                </div>
              ) : (
                <div className="mb-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">{'\u5c1a\u672a\u4e0a\u50b3\u5716\u7247\u3002'}</div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void onRunAction(`upload-${item.key}`, async () => {
                    await onUploadImage(item.key, file);
                    return `${item.description || item.key} 已上傳完成。`;
                  });
                  event.currentTarget.value = '';
                }}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busyAction === `upload-${item.key}`} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50">
                {busyAction === `upload-${item.key}` ? '\u4e0a\u50b3\u4e2d...' : '\u4e0a\u50b3\u5716\u7247'}
              </button>
            </div>
          )}

          {TESTABLE_AI_KEY_FIELDS.has(item.key) && (
            <button
              type="button"
              onClick={() => {
                const provider = item.key.replace('ai_', '').replace('_api_key', '') as 'gemini' | 'openai';
                void onRunAction(actionKey, async () => {
                  const res = await fetch('/api/ai/test-connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ provider, apiKey: normalizeMaskedValue(value), modelId: getCurrentValue(`ai_${provider}_model`) }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data.error || `${provider} \u6e2c\u8a66\u5931\u6557\u3002`);
                  return data.message || `${provider} \u9023\u7dda\u6210\u529f\u3002`;
                });
              }}
              disabled={busyAction === actionKey}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50"
            >
              {busyAction === actionKey ? '\u6e2c\u8a66\u4e2d...' : '\u6e2c\u8a66\u9023\u7dda'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  function renderInput() {
    if (item.type === 'boolean') {
      return (
        <button type="button" onClick={() => onChange(value === 'true' ? 'false' : 'true')} className={`relative inline-flex h-8 w-14 items-center rounded-full ${value === 'true' ? 'bg-efan-primary' : 'bg-gray-200'}`}>
          <span className={`inline-block h-6 w-6 rounded-full bg-white transition-transform ${value === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      );
    }

    if (item.key === 'ai_provider') {
      return (
        <select className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-efan-primary" value={value} onChange={(event) => onChange(event.target.value)}>
          {PROVIDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      );
    }

    if (isModelField) {
      const options = modelOptions.length ? modelOptions : value ? [{ id: value, name: value }] : [];
      const hasCurrentOption = options.some((option) => option.id === value);
      const selectOptions = hasCurrentOption || !value ? options : [{ id: value, name: value }, ...options];

      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select className="flex-1 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-efan-primary" value={value} onChange={(event) => onChange(event.target.value)}>
              {!value && <option value="">{'\u9078\u64c7\u6a21\u578b'}</option>}
              {selectOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
            {onRefreshModels && (
              <button type="button" onClick={() => { void onRefreshModels(); }} disabled={modelLoading} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50">
                {modelLoading ? '\u8f09\u5165\u4e2d...' : '\u91cd\u65b0\u6574\u7406'}
              </button>
            )}
          </div>
            <input type="text" className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-efan-primary" value={value} onChange={(event) => onChange(event.target.value)} placeholder="\u6a21\u578b ID" />
        </div>
      );
    }

    if (item.type === 'json' || item.key.includes('message') || item.key.includes('note') || item.key.includes('terms')) {
      return <textarea className="min-h-[120px] w-full rounded-2xl bg-white px-5 py-4 text-sm shadow-inner focus:ring-2 focus:ring-efan-primary" value={value} onChange={(event) => onChange(event.target.value)} />;
    }

    return (
      <input
        type={item.type === 'number' ? 'number' : item.type === 'encrypted' ? 'password' : 'text'}
        className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:ring-2 focus:ring-efan-primary"
        value={inputValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={item.type === 'encrypted' ? '留空可保留目前的值' : '請輸入內容'}
      />
    );
  }
}
