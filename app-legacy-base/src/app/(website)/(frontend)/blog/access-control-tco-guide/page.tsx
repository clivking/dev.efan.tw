import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyAccessControlTcoGuideRedirect() {
  permanentRedirect('/guides/2026-access-control-tco-analysis');
}
