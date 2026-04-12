import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDocTitle(name: string | null, suffix: string): string {
  if (!name) return suffix;
  // Strip "報價單" if present at the end
  const baseName = name.trim().replace(/報價單$/, '').trim();
  if (suffix === '報價單') return baseName + suffix;
  return `${baseName}－${suffix}`;
}

export function extractArea(address: string | null | undefined): string {
  if (!address) return '';
  // 匹配 XX市/縣 之後的行政區 (區/鄉/鎮/市)
  const match = address.match(/(?:市|縣)([^市縣]+?[區鄉鎮市])/);
  if (match && match[1]) {
    return match[1].slice(0, -1);
  }
  return '';
}

export function simplifyCompanyName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/(?:有限公司|股份有限公司)$/, '').trim();
}

