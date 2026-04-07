import { Code2, ExternalLink, FileSearch, Send } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ATTESTATION_KIND } from '@/lib/attestation';
import { formatKind } from '@/lib/nostrKinds';

const attestationNipUrl = 'https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qyfhwumn8ghj7un9d3shjtnyv9ujuct89uqqcct5w3jhxarpw35k7mnnaawl4h';
const githubRepoUrl = 'https://github.com/dadofsambonzuki/attestr';

export default function Developers() {
  const attestationKinds = [ATTESTATION_KIND, 31872, 31873, 11871];

  useSeoMeta({
    title: 'Attestr',
    description: 'How to publish and render Nostr attestations, with tags, filters, and implementation examples.',
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Developers</Badge>
            {attestationKinds.map((kind) => (
              <Badge key={kind}>{formatKind(kind)}</Badge>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Build with Attestations</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700 sm:text-lg">
            Attestations are Nostr events that reference another event and add lifecycle status, optional validity
            windows, and optional notes. Use them to express trust judgments and let clients render verifiable context.
          </p>

          <div className="flex flex-wrap gap-3 pt-8">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href={attestationNipUrl} target="_blank" rel="noreferrer noopener">
                Read Attestation NIP
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer noopener">
                View GitHub Repo
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
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
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
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
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
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <img
                  src="https://www.nostria.app/favicon.ico"
                  alt="Nostria logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Nostria</span>
              </a>

              <a
                href="https://walletscrutiny.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <img
                  src="https://walletscrutiny.com/images/favicon-32x32.png"
                  alt="WalletScrutiny logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">WalletScrutiny</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="h-5 w-5" />
                Publish an Attestation
              </CardTitle>
              <CardDescription>{formatKind(31871)}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use {formatKind(ATTESTATION_KIND)} and include the minimum tags for reference and status.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><code className="font-mono text-xs">d</code>: unique identifier for this attestation event</li>
                <li><code className="font-mono text-xs">e</code> or <code className="font-mono text-xs">a</code>: exactly one target assertion reference</li>
                <li><code className="font-mono text-xs">s</code>: lifecycle status (<code className="font-mono text-xs">verifying</code>, <code className="font-mono text-xs">valid</code>, <code className="font-mono text-xs">invalid</code>, <code className="font-mono text-xs">revoked</code>)</li>
                <li><code className="font-mono text-xs">valid_from</code>, <code className="font-mono text-xs">valid_to</code>: optional unix timestamps</li>
                <li><code className="font-mono text-xs">expiration</code>, <code className="font-mono text-xs">request</code>: optional workflow tags</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`createEvent({
  kind: ${ATTESTATION_KIND},
  tags: [
    ['d', 'attestation-id'],
    ['e', '<assertion-event-id>'],
    ['s', 'verifying'],
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
              <CardDescription>{formatKind(31872)}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use {formatKind(31872)} to request an attestation from one or more attestors for a specific assertion.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Include <code className="font-mono text-xs">d</code> and exactly one assertion reference tag.</li>
                <li>Optionally add <code className="font-mono text-xs">p</code> tags for requested attestors.</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
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
              <CardDescription>{formatKind(31873)}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use {formatKind(31873)} to recommend an attestor for specific event kinds.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Use <code className="font-mono text-xs">d</code> as <code className="font-mono text-xs">&lt;attestor-pubkey&gt;&lt;recommendation-id&gt;</code>.</li>
                <li>Include <code className="font-mono text-xs">p</code> with the recommended attestor pubkey.</li>
                <li>Add one or more <code className="font-mono text-xs">k</code> tags for supported kinds.</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`createEvent({
  kind: 31873,
  tags: [
    ['d', '<attestor-pubkey><recommendation-id>'],
    ['p', '<attestor-pubkey>'],
    ['k', '1'],
    ['k', '30023']
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
              <CardDescription>{formatKind(11871)}</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use replaceable {formatKind(11871)} to declare which event kinds an attestor can verify.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Include one or more <code className="font-mono text-xs">k</code> tags for supported kinds.</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`createEvent({
  kind: 11871,
  tags: [
    ['k', '1'],
    ['k', '30023']
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
              Query attestations by event kind, status, and assertion reference tags. Then parse tags into UI fields
              (status, validity window, and reference type).
            </p>
            <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`const events = await nostr.query([{
  kinds: [${ATTESTATION_KIND}],
  '#s': ['verifying', 'valid', 'invalid', 'revoked'],
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
