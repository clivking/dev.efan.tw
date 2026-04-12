import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyOfficeAccessControlGuideRedirect() {
  permanentRedirect('/guides/office-access-control-upgrade-guide');
}
