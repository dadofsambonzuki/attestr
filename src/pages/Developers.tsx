import { Code2, ExternalLink, FileSearch, Send } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ATTESTATION_KIND } from '@/lib/attestation';

const attestationNipUrl = 'https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qyfhwumn8ghj7un9d3shjtnyv9ujuct89uqqcct5w3jhxarpw35k7mnnaawl4h';

export default function Developers() {
  useSeoMeta({
    title: 'Attestr',
    description: 'How to publish and render Nostr attestations, with tags, filters, and implementation examples.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Developers</Badge>
            <Badge>Kind {ATTESTATION_KIND}</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Build with Attestations</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700 sm:text-lg">
            Attestations are Nostr events that reference another event and add lifecycle status, validity metadata,
            and optional notes. Use them to express trust judgments and let clients render verifiable context.
          </p>

          <div className="flex flex-wrap gap-3 pt-8">
            <Button asChild>
              <a href={attestationNipUrl} target="_blank" rel="noreferrer noopener">
                Read Attestation NIP
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="h-5 w-5" />
                Publish an Attestation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Use attestation kind {ATTESTATION_KIND} and include the minimum tags for reference and status.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><code className="font-mono text-xs">d</code>: unique identifier for this attestation event</li>
                <li><code className="font-mono text-xs">e</code> or <code className="font-mono text-xs">a</code>: target assertion reference</li>
                <li><code className="font-mono text-xs">s</code>: lifecycle status (<code className="font-mono text-xs">accepted</code>, <code className="font-mono text-xs">rejected</code>, <code className="font-mono text-xs">verifying</code>, <code className="font-mono text-xs">verified</code>, <code className="font-mono text-xs">revoked</code>)</li>
                <li><code className="font-mono text-xs">v</code>: optional validity (<code className="font-mono text-xs">valid</code>/<code className="font-mono text-xs">invalid</code>) when status is verified</li>
                <li><code className="font-mono text-xs">valid_from</code>, <code className="font-mono text-xs">valid_to</code>: optional unix timestamps</li>
              </ul>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`createEvent({
  kind: ${ATTESTATION_KIND},
  tags: [
    ['d', 'attestation-id'],
    ['e', '<assertion-event-id>'],
    ['s', 'verified'],
    ['v', 'valid'],
    ['valid_from', '1735689600'],
    ['valid_to', '1767225600']
  ],
  content: 'Evidence reviewed and claim verified.'
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileSearch className="h-5 w-5" />
                Query and Render
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>
                Query attestations by kind and assertion reference tags. Then parse tags into UI fields (status,
                validity window, and reference type).
              </p>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`const events = await nostr.query([{
  kinds: [${ATTESTATION_KIND}],
  '#e': [assertionId],
  limit: 50,
}]);

const cards = events.map((event) => {
  const parsed = parseAttestation(event);
  return {
    id: event.id,
    status: parsed.status,
    validity: parsed.validity,
    validFrom: parsed.validFrom,
    validTo: parsed.validTo,
    note: event.content,
  };
});`}
              </pre>
              <p className="text-xs text-slate-600">
                For addressable assertions, reference with <code className="font-mono">a</code> tags and query with
                <code className="font-mono"> #a</code>. Keep long IDs wrapped in UI to avoid mobile overflow.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Code2 className="h-5 w-5" />
              Implementation Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>- Treat attestations as public claims; show author and timestamps clearly.</p>
            <p>- Use explicit wrapping classes for event IDs and coordinates on mobile screens.</p>
            <p>- Prefer one query with combined filters when possible to reduce relay load.</p>
            <p>- Keep status transitions auditable; publish new attestation events rather than mutating prior history.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
