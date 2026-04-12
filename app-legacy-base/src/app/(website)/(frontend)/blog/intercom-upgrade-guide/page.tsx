import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyIntercomUpgradeGuideRedirect() {
  permanentRedirect('/guides/intercom-upgrade-comparison');
}
