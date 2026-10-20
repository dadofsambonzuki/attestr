import { Code2, ExternalLink, FileSearch, Send, EyeOff, Fingerprint, Server } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';

import { AppHeader } from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ATTESTATION_KIND,
  ATTESTOR_PROFICIENCY_DECLARATION_KIND,
  ATTESTOR_RECOMMENDATION_KIND,
  TRUSTED_LISTS_KIND,
} from '@/lib/attestation';
import { formatKind } from '@/lib/nostrKinds';

const attestationNipUrl = 'https://nostrhub.io/naddr1qvzqqqrcvypzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qyfhwumn8ghj7un9d3shjtnyv9ujuct89uqqcct5w3jhxarpw35k7mnnaawl4h';
const gitworkshopRepoUrl = 'https://gitworkshop.dev/nathan@day.ag/attestr';
const relayUrl = 'wss://relay.attestr.xyz';

// Kinds the attestr relay accepts. Kept in step with the relay's write policy
// (/opt/strfry/attestr/policy.py on the VPS).
const relayAttestationKinds = [
  1040, 11871, 31871, 31872, 31873, 31874, 10040, 30382, 30383, 30384, 30392, 30393, 30394, 30395,
];
const relayCommonKinds = [0, 1, 3, 5, 6, 7, 16, 1111, 9735, 10002];

export default function Developers() {
  const LEGACY_TRUSTED_ATTESTORS_KIND = 31874;

  useSeoMeta({
    title: 'Attestr',
    description: 'How to publish and render Nostr attestations, with tags, filters, and implementation examples.',
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-100 via-white to-amber-50 text-slate-900">
      <AppHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build with Attestations</h1>
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
              <a href={gitworkshopRepoUrl} target="_blank" rel="noreferrer noopener">
                View Repo on GitWorkshop
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Server className="h-5 w-5" />
              Attestation Relay
            </CardTitle>
            <CardDescription>
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">{relayUrl}</Badge>
                <Badge variant="outline">No AUTH required</Badge>
                <Badge variant="outline">Sweeps public relays</Badge>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <p>
              A relay run for attestation events. It stores the attestation kinds below alongside the usual
              social kinds, and it sweeps the attestation kinds from public relays, so attestations published
              elsewhere are readable here too. Attestr reads from it first, then adds anything else it finds
              on your own relays.
            </p>

            <div className="space-y-2">
              <p className="font-medium text-slate-900">Attestation kinds</p>
              <div className="flex flex-wrap gap-2">
                {relayAttestationKinds.map((kind) => (
                  <Badge key={kind} variant="outline" className="font-mono text-[11px]">
                    {formatKind(kind)}
                  </Badge>
                ))}
              </div>
              <p className="pt-2 font-medium text-slate-900">Common kinds</p>
              <div className="flex flex-wrap gap-2">
                {relayCommonKinds.map((kind) => (
                  <Badge key={kind} variant="outline" className="font-mono text-[11px]">
                    {formatKind(kind)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <p className="font-medium text-slate-900">Query attestations</p>
                <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs flex-1">
{`const relay = nostr.relay('${relayUrl}');

const attestations = await relay.query([{
  kinds: [${ATTESTATION_KIND}],
  '#e': [assertionEventId],
  limit: 50,
}]);`}
                </pre>
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <p className="font-medium text-slate-900">Publish and read with nak</p>
                <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs flex-1">
{`nak event -k ${ATTESTATION_KIND} \\
  -t d=my-attestation \\
  -t e=<assertion-event-id> \\
  -t s=valid \\
  -c 'Evidence reviewed.' \\
  ${relayUrl}

nak req -k ${ATTESTATION_KIND} -l 20 ${relayUrl}`}
                </pre>
              </div>
            </div>

            <ul className="list-disc space-y-1 pl-5">
              <li>
                Writes are capped at 20 events per minute per IP; any kind outside the lists above is refused
                with <code className="font-mono text-xs">blocked: kind &lt;kind&gt;</code>.
              </li>
              <li>Reads are unrestricted and no NIP-42 authentication is needed.</li>
              <li>Kinds 4 and 1059 are not stored here — keep direct messages on a DM-capable relay.</li>
            </ul>
          </CardContent>
        </Card>

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
                  src="/favicon/favicon.svg"
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
                  src="/images/clients/amethyst.jpg"
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
                  src="/images/clients/nostria.ico"
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
                  src="/images/clients/walletscrutiny.png"
                  alt="WalletScrutiny logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">WalletScrutiny</span>
              </a>

              <a
                href="https://getsafebox.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <img
                  src="/images/clients/safebox.ico"
                  alt="SafeBox logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">SafeBox</span>
              </a>

              <a
                href="https://www.archipelago-foundation.org"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <img
                  src="/images/clients/archipelago.svg"
                  alt="Archipelago logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Archipelago</span>
              </a>

              <a
                href="https://ditto.pub/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <img
                  src="/images/clients/ditto.ico"
                  alt="Ditto logo"
                  className="h-6 w-6 rounded-sm"
                  loading="lazy"
                />
                <span className="font-medium text-slate-900">Ditto</span>
              </a>

              <a
                href="https://github.com/KC-Bitcoiners/bodarc"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <Fingerprint className="h-6 w-6 rounded-sm text-slate-700" />
                <span className="font-medium text-slate-900">bodarc</span>
              </a>

              <a
                href="https://veil.forgesworn.dev/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 sm:w-auto"
              >
                <EyeOff className="h-6 w-6 rounded-sm text-slate-700" />
                <span className="font-medium text-slate-900">Veil</span>
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
              <CardDescription>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatKind(ATTESTATION_KIND)}</Badge>
                </span>
              </CardDescription>
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
              <CardDescription>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatKind(31872)}</Badge>
                </span>
              </CardDescription>
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
              <CardDescription>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatKind(TRUSTED_LISTS_KIND)} + t=trusted-attestor</Badge>
                  <Badge variant="outline">{formatKind(ATTESTOR_RECOMMENDATION_KIND)}</Badge>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use a trusted-attestor relation to recommend an attestor for specific assertion kinds.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Legacy:</strong> <code className="font-mono text-xs">k</code> tags on kind <code className="font-mono text-xs">{ATTESTOR_RECOMMENDATION_KIND}</code>.</li>
                <li><strong>Current:</strong> kind <code className="font-mono text-xs">{TRUSTED_LISTS_KIND}</code> with <code className="font-mono text-xs">t=trusted-attestor</code>, <code className="font-mono text-xs">p=&lt;attestor&gt;</code>, and <code className="font-mono text-xs">t=k:&lt;kind&gt;</code>.</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`// Current trusted-list form
createEvent({
  kind: ${TRUSTED_LISTS_KIND},
  tags: [
    ['d', 'trusted-attestor:<attestor-pubkey>'],
    ['t', 'trusted-attestor'],
    ['p', '<attestor-pubkey>'],
    ['t', 'k:1'],
    ['t', 'k:30023']
  ],
  content: ''
});`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileSearch className="h-5 w-5" />
                Trusted Attestors List
              </CardTitle>
              <CardDescription>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatKind(TRUSTED_LISTS_KIND)} + t=trusted-attestors</Badge>
                  <Badge variant="outline">{formatKind(LEGACY_TRUSTED_ATTESTORS_KIND)}</Badge>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Use trusted-attestors lists to publish multiple approved attestors for one assertion kind.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Legacy:</strong> kind <code className="font-mono text-xs">{LEGACY_TRUSTED_ATTESTORS_KIND}</code> with <code className="font-mono text-xs">k</code> and repeatable <code className="font-mono text-xs">p</code>.</li>
                <li><strong>Current:</strong> kind <code className="font-mono text-xs">{TRUSTED_LISTS_KIND}</code> with <code className="font-mono text-xs">t=trusted-attestors</code>, <code className="font-mono text-xs">t=k:&lt;kind&gt;</code>, and repeatable <code className="font-mono text-xs">p</code>.</li>
              </ul>
              <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`createEvent({
  kind: ${TRUSTED_LISTS_KIND},
  tags: [
    ['d', 'trusted-attestors:1'],
    ['t', 'trusted-attestors'],
    ['t', 'k:1'],
    ['p', '<attestor-pubkey-1>'],
    ['p', '<attestor-pubkey-2>']
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
              <CardDescription>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatKind(TRUSTED_LISTS_KIND)} + self trusted-attestor</Badge>
                  <Badge variant="outline">{formatKind(ATTESTOR_PROFICIENCY_DECLARATION_KIND)}</Badge>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3 text-sm text-slate-700">
              <p>Declare which event kinds an attestor can verify (self-claim format).</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Legacy:</strong> replaceable kind <code className="font-mono text-xs">{ATTESTOR_PROFICIENCY_DECLARATION_KIND}</code> with <code className="font-mono text-xs">k</code> tags.</li>
                <li><strong>Current:</strong> kind <code className="font-mono text-xs">{TRUSTED_LISTS_KIND}</code>, <code className="font-mono text-xs">t=trusted-attestor</code>, <code className="font-mono text-xs">p=&lt;author-pubkey&gt;</code>, and <code className="font-mono text-xs">t=k:&lt;kind&gt;</code>.</li>
              </ul>
               <pre className="w-full max-w-full overflow-x-auto rounded-md border bg-slate-50 p-3 text-[11px] text-slate-800 sm:text-xs">
{`createEvent({
  kind: ${TRUSTED_LISTS_KIND},
  tags: [
    ['d', 'trusted-attestor:<author-pubkey>'],
    ['t', 'trusted-attestor'],
    ['p', '<author-pubkey>'],
    ['t', 'k:1'],
    ['t', 'k:30023']
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
