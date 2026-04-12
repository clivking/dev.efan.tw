import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyPbxVsCloudTelephonyRedirect() {
  permanentRedirect('/guides/cloud-vs-onprem-pbx');
}
