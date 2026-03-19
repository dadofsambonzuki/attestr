import { useSeoMeta } from '@unhead/react';
import { AppHeader } from '@/components/AppHeader';
import { AttestrWorkspace } from '@/components/attestr/AttestrWorkspace';

export default function Attest() {
  useSeoMeta({
    title: 'Attestr Workspace',
    description: 'Search assertion events and publish attestations on Nostr.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AttestrWorkspace />
      </div>
    </div>
  );
}
