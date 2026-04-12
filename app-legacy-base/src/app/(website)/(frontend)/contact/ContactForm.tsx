'use client';

import { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        details: '',
    });
    const [honeypot, setHoneypot] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [siteConfig, setSiteConfig] = useState<{ turnstileEnabled: boolean; turnstileSiteKey: string | null }>({
        turnstileEnabled: false,
        turnstileSiteKey: null,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    // Fetch site config for Turnstile
    useEffect(() => {
        fetch('/api/public/site-config')
            .then(res => res.json())
            .then(data => setSiteConfig(data))
            .catch(() => { /* Turnstile won't load, form still works */ });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        const trimmedPhone = formData.phone.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedDetails = formData.details.trim();

        if (!trimmedName || !trimmedPhone || !trimmedEmail) {
            setError('請完整填寫聯絡姓名、聯絡電話與電子郵件。');
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setError('請填寫正確的電子郵件格式，方便我們回信報價。');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: trimmedName,
                    phone: trimmedPhone,
                    email: trimmedEmail,
                    details: trimmedDetails || '',
                    website: honeypot || undefined,       // honeypot field
                    turnstileToken: turnstileToken || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || '提交失敗');
            }

            setSuccess(true);
            setFormData({ name: '', phone: '', email: '', details: '' });
        } catch (err: any) {
            setError(err.message || '提交失敗，請稍後再試，或直接撥打電話與我們聯繫。');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center">
                <div className="text-5xl mb-4 text-emerald-500">✅</div>
                <h3 className="text-xl font-bold text-emerald-800 mb-2">感謝您的來信</h3>
                <p className="text-emerald-600 mb-6">您的需求已成功送達，專員將盡快為您服務。</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-emerald-800 font-bold underline underline-offset-4"
                >
                    再次提交需求
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
                    {error}
                </div>
            )}

            {/* Honeypot — hidden from humans, visible to bots */}
            <div className="absolute opacity-0 h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    name="website"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">聯絡姓名 *</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all"
                    placeholder="您的稱呼"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">聯絡電話 *</label>
                    <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">電子郵件 *</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={(e) => setFormData((prev) => ({ ...prev, email: e.target.value.trim() }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all"
                        autoComplete="email"
                        aria-required="true"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">需求簡述</label>
                <textarea
                    rows={4}
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-efan-accent/20 focus:border-efan-accent outline-none transition-all"
                    placeholder="請描述您的安裝需求、案場位置或特殊需求..."
                />
            </div>

            {/* Turnstile widget */}
            {siteConfig.turnstileEnabled && siteConfig.turnstileSiteKey && (
                <div className="flex justify-center">
                    <Turnstile
                        siteKey={siteConfig.turnstileSiteKey}
                        onSuccess={(token) => setTurnstileToken(token)}
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-efan-accent hover:bg-efan-accent-dark disabled:bg-gray-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-efan-accent/30 transition-all active:scale-[0.98]"
            >
                {loading ? '提交中...' : '送出需求單'}
            </button>
        </form>
    );
}
