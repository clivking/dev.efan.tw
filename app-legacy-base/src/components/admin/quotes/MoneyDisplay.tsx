'use client';

export default function MoneyDisplay({ amount, className = '', prefix = '$' }: { amount: number | string; className?: string; prefix?: string }) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return <span className={className}>-</span>;
    const formatted = Math.round(num).toLocaleString('zh-TW');
    return <span className={className}>{prefix}{formatted}</span>;
}
