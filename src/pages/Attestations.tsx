import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { AttestationsWorkspace } from '@/components/attestr/AttestationsWorkspace';

export default function Attestations() {
  useSeoMeta({
    title: 'Attestr Attestations',
    description: 'Search, filter, and inspect attestation events on Nostr.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AttestationsWorkspace />
      </div>
    </div>
  );
}
