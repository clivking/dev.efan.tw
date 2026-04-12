// Re-export all shared types from the canonical location.
// This file is kept for backwards-compatibility so existing /quote-request imports still work.

export type {
    ServiceType,
    BudgetTier,
    AccessControlDetails,
    CCTVDetails,
    PhoneSystemDetails,
    AttendanceDetails,
    NetworkDetails,
    QuoteRequestData,
    ConsultationData,
} from '@/lib/types/consultation-types';

export {
    SERVICE_LABELS,
    BUDGET_TIER_LABELS,
    INITIAL_QUOTE_REQUEST_DATA as INITIAL_DATA,
} from '@/lib/types/consultation-types';
