import { unstable_cache } from 'next/cache';
import { getSettings } from './settings';

export interface CompanyInfo {
    name: string;
    nameEn: string;
    phone: string;
    email: string;
    address: string;
    tagline: string;
    logoUrl: string;
    taxId: string;
    foundedYear: number;
    yearsInBusiness: number;
    clientCount: number;
    googleRating: number;
    googleReviews: number;
    siteTitleSuffix: string;
    pdfLogoUrl: string;
    ga4Id: string;
    faviconUrl: string;
}

const FOUNDED_YEAR = 1984;

const FALLBACK: CompanyInfo = {
    name: '一帆安全整合有限公司',
    nameEn: 'Efan Security Integration',
    phone: '02-7730-1158',
    email: 'pro@efan.tw',
    address: '台北市大安區四維路14巷15號7樓之1',
    tagline: '40年專業門禁×監視×總機整合｜超過2,600家企業信賴',
    logoUrl: '/images/logo.png',
    taxId: '',
    foundedYear: FOUNDED_YEAR,
    yearsInBusiness: new Date().getFullYear() - FOUNDED_YEAR,
    clientCount: 2600,
    googleRating: 5.0,
    googleReviews: 18,
    siteTitleSuffix: '｜一帆安全整合',
    pdfLogoUrl: '',
    ga4Id: '',
    faviconUrl: '/favicon.ico',
};

// Cache company info for 1 hour across ALL requests (not per-request)
const getCachedCompanyInfo = unstable_cache(
    async (): Promise<CompanyInfo> => {
        try {
            const keys = [
                'company_name', 'company_name_en', 'company_phone',
                'company_email', 'company_address', 'company_logo_url',
                'company_description', 'tax_id', 'completed_case_count',
                'site_title_suffix', 'pdf_logo_url', 'ga4_measurement_id', 'company_favicon_url',
                'google_rating', 'google_reviews'
            ];
            const settings = await getSettings(keys);
            return {
                name: settings['company_name'] || FALLBACK.name,
                nameEn: settings['company_name_en'] || FALLBACK.nameEn,
                phone: settings['company_phone'] || FALLBACK.phone,
                email: settings['company_email'] || FALLBACK.email,
                address: settings['company_address'] || FALLBACK.address,
                tagline: settings['company_description'] || FALLBACK.tagline,
                logoUrl: settings['company_logo_url'] || FALLBACK.logoUrl,
                taxId: settings['tax_id'] || FALLBACK.taxId,
                foundedYear: FOUNDED_YEAR,
                yearsInBusiness: new Date().getFullYear() - FOUNDED_YEAR,
                clientCount: Number(settings['completed_case_count'] || FALLBACK.clientCount),
                googleRating: Number(settings['google_rating'] || FALLBACK.googleRating),
                googleReviews: Number(settings['google_reviews'] || FALLBACK.googleReviews),
                siteTitleSuffix: settings['site_title_suffix'] || FALLBACK.siteTitleSuffix,
                pdfLogoUrl: settings['pdf_logo_url'] || '',
                ga4Id: settings['ga4_measurement_id'] || '',
                faviconUrl: settings['company_favicon_url'] || FALLBACK.faviconUrl,
            };
        } catch (error) {
            console.error('[Company] DB fetch failed, using fallback:', error);
            return FALLBACK;
        }
    },
    ['company-info'],
    { revalidate: 3600, tags: ['company'] }
);

export async function getCompanyInfo(): Promise<CompanyInfo> {
    // During build phase (no DB available), return fallback directly
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return FALLBACK;
    }
    return getCachedCompanyInfo();
}
