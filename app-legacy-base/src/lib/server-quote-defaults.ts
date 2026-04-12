import { getSetting } from '@/lib/settings';
import { DEFAULT_CUSTOMER_NOTE } from '@/lib/quote-defaults';

export async function getDefaultCustomerNoteSetting() {
    return getSetting('default_customer_note', DEFAULT_CUSTOMER_NOTE);
}
