import { Code2, ExternalLink, FileSearch, Send } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ATTESTATION_KIND } from '@/lib/attestation';

const attestationNipUrl = 'https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qyfhwumn8ghj7un9d3shjtnyv9ujuct89uqqcct5w3jhxarpw35k7mnnaawl4h';

export default function Developers() {
  const attestationKinds = [ATTESTATION_KIND, 31872, 31873, 11871];

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
            {attestationKinds.map((kind) => (
              <Badge key={kind}>Kind {kind}</Badge>
            ))}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Clients Implementing the Attestation NIP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300"
              >
                <img
                  src="/images/attestr-icon.png"
                  alt="Attestr logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Attestr</span>
              </a>

              <a
                href="https://amethyst.social/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300"
              >
                <img
                  src="https://amethyst.social/amethyst-logo.jpg"
                  alt="Amethyst logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Amethyst</span>
              </a>

              <a
                href="https://www.nostria.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300"
              >
                <img
                  src="https://www.nostria.app/favicon.ico"
                  alt="Nostria logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Nostria</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="h-5 w-5" />
                Publish an Attestation
              </CardTitle>
              <CardDescription>Kind 31871</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Use attestation kind {ATTESTATION_KIND} and include the minimum tags for reference and status.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><code className="font-mono text-xs">d</code>: unique identifier for this attestation event</li>
                <li><code className="font-mono text-xs">e</code> or <code className="font-mono text-xs">a</code>: target assertion reference</li>
                <li><code className="font-mono text-xs">s</code>: lifecycle status (<code className="font-mono text-xs">verifying</code>, <code className="font-mono text-xs">valid</code>, <code className="font-mono text-xs">invalid</code>, <code className="font-mono text-xs">revoked</code>)</li>
                <li><code className="font-mono text-xs">valid_from</code>, <code className="font-mono text-xs">valid_to</code>: optional unix timestamps</li>
              </ul>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`createEvent({
  kind: ${ATTESTATION_KIND},
  tags: [
    ['d', 'attestation-id'],
    ['e', '<assertion-event-id>'],
    ['s', 'valid'],
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
                Attestation Request
              </CardTitle>
              <CardDescription>Kind 31872</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Use kind 31872 to request an attestation from one or more attestors for a specific assertion.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Include <code className="font-mono text-xs">d</code> and exactly one assertion reference tag.</li>
                <li>Optionally add <code className="font-mono text-xs">p</code> tags for requested attestors.</li>
              </ul>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`createEvent({
  kind: 31872,
  tags: [
    ['d', 'npub1requestor...:request-1'],
    ['e', '<assertion-event-id>'],
    ['p', '<attestor-pubkey>']
  ],
  content: 'Please verify this assertion.'
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Code2 className="h-5 w-5" />
                Attestor Recommendation
              </CardTitle>
              <CardDescription>Kind 31873</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Use kind 31873 to recommend an attestor for specific event kinds.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Use <code className="font-mono text-xs">d</code> to identify the recommended attestor.</li>
                <li>Add one or more <code className="font-mono text-xs">k</code> tags for supported kinds.</li>
              </ul>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`createEvent({
  kind: 31873,
  tags: [
    ['d', '<attestor-pubkey>'],
    ['k', '1'],
    ['k', '30023'],
    ['desc', 'Reliable for content verification']
  ],
  content: ''
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ExternalLink className="h-5 w-5" />
                Proficiency Declaration
              </CardTitle>
              <CardDescription>Kind 11871</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Use replaceable kind 11871 to declare which event kinds an attestor can verify.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Include the attestor in <code className="font-mono text-xs">p</code> and one or more <code className="font-mono text-xs">k</code> tags.</li>
                <li>Optionally add <code className="font-mono text-xs">desc</code> for context.</li>
              </ul>
              <pre className="overflow-x-auto rounded-md border bg-slate-50 p-3 text-xs text-slate-800">
{`createEvent({
  kind: 11871,
  tags: [
    ['p', '<attestor-pubkey>'],
    ['k', '1'],
    ['k', '30023'],
    ['desc', 'I verify notes and long-form posts']
  ],
  content: ''
});`}
              </pre>
            </CardContent>
          </Card>
        </div>

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
