import { useSeoMeta } from '@unhead/react';
import { ArrowRight, BadgeCheck, Search, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';


const Index = () => {
  useSeoMeta({
    title: 'Attestr',
    description: 'Search assertions, publish attestations, and inspect trust signals with comments and zaps.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,rgba(14,165,233,0.20),transparent_40%),radial-gradient(circle_at_78%_10%,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_60%_85%,rgba(14,116,144,0.12),transparent_35%)]" />

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="space-y-6 lg:col-span-3">
              <img
                src="/images/attestr-logo-side.png"
                alt="Attestr logo"
                className="h-[72px] w-auto sm:h-[84px]"
              />

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Notaries on Nostr
              </h1>

              <p className="max-w-2xl text-xl font-medium text-slate-700 sm:text-2xl">
                For claims that need context, transparency, and accountability.
              </p>

              <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
                Every event on Nostr is an assertion by the creator. Attestations are verifications from others who evaluate those assertions. Attestr helps both sides connect and lets observers inspect trust signals in one place.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <ExplainerCard icon={Search} title="Search Assertions" text="Find assertion events by NIP-05 author, content, event kind, or direct IDs." />
                <ExplainerCard icon={BadgeCheck} title="Publish Attestations" text="Attach status and optional validity windows to one selected assertion event." />
                <ExplainerCard icon={ShieldCheck} title="Inspect Lifecycle" text="Track status, validity, comments, and zaps in a focused attestation detail view." />
              </div>
            </div>

            <Card className="border-slate-200 bg-white/90 shadow-lg lg:col-span-2">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">How it works</p>
                <div className="space-y-3">
                  <Step number="1" title="Find one assertion" text="Search any kind of event or paste note1/nevent1/naddr1 directly." />
                  <Step number="2" title="Attest with status" text="Publish an attestation with lifecycle state, optional duration, and note." />
                  <Step number="3" title="Open the detail panel" text="Review linked assertions, comments, zaps, and lifecycle updates." />
                </div>

                <Button asChild className="w-full gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  <a href="/attest">
                    Start Attesting
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

function ExplainerCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Search;
  title: string;
  text: string;
}) {
  return (
    <Card className="h-full border-slate-200 bg-white/75 shadow-sm backdrop-blur">
      <CardContent className="space-y-2 p-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm leading-relaxed text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {number}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  );
}

export default Index;
