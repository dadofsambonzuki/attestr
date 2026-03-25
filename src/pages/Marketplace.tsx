import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Marketplace() {
  useSeoMeta({
    title: 'Marketplace • Attestr',
    description: 'Attestr marketplace for attestors and requests is coming soon.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">Coming soon. We are building specialist attestor discovery, requests, and recommendations.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
