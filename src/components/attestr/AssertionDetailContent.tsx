import type { NostrEvent } from '@nostrify/nostrify';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTrustedAttestorsForKind } from '@/hooks/useTrustedAttestorsForKind';
import { encodeEventPointer, encodeNpub, getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestAssertionDialog } from './AttestAssertionDialog';
import { RequestAssertionDialog } from './RequestAssertionDialog';
import { ATTESTATION_KIND, createAssertionTag, parseAttestation } from '@/lib/attestation';
import { AttestationStatusBadge } from './AttestationStatusBadge';
import { EventDeletionRequestButton } from './EventDeletionRequestButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssertionDetailContentProps {
  assertion: NostrEvent;
}

export function AssertionDetailContent({ assertion }: AssertionDetailContentProps) {
  const { nostr } = useNostr();
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const pointer = encodeEventPointer(assertion);
  const authorNpub = encodeNpub(assertion.pubkey);
  const author = useAuthor(assertion.pubkey);
  const authorName = getNostrDisplayName(author.data?.metadata, assertion.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const { user } = useCurrentUser();

  const trustedAttestorsQuery = useTrustedAttestorsForKind(user?.pubkey, assertion.kind);
  const trustedAttestors = trustedAttestorsQuery.data ?? [];
  const trustedAttestorReasons = new Map(trustedAttestors.map((entry) => [entry.attestorPubkey, entry]));

  const associatedAttestationsQuery = useQuery({
    queryKey: ['nostr', 'assertion-associated-attestations', assertion.id],
    queryFn: async () => {
      const [tagName, tagValue] = createAssertionTag(assertion);
      const filter: Record<string, string[] | number[]> = {
        kinds: [ATTESTATION_KIND],
      };

      if (tagName === 'e') {
        filter['#e'] = [tagValue];
      } else {
        filter['#a'] = [tagValue];
      }

      const events = await nostr.query([
        {
          ...filter,
          limit: 100,
        },
      ], { signal: AbortSignal.timeout(6000) });

      return dedupeById(events).sort((a, b) => b.created_at - a.created_at);
    },
  });

  const associatedAttestations = associatedAttestationsQuery.data ?? [];

  return (
    <div className="mt-2 min-w-0 space-y-6">
      <div className="rounded-md border bg-muted/30 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Event pointer</p>
        <p className="mt-1 break-all font-mono text-xs text-foreground">{pointer}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{formatKind(assertion.kind)}</Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAttestDialogOpen(true)}
        >
          Attest
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRequestDialogOpen(true)}
        >
          Request
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <Link to={`/${pointer}`}>View details</Link>
        </Button>
        <EventDeletionRequestButton event={assertion} />
      </div>

      <div className="grid min-w-0 gap-3 rounded-md border p-4">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Author</p>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-7 w-7 border border-slate-200">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback className="text-[10px]">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <a
              href={getProfilePath(assertion.pubkey)}
              className="truncate text-sm hover:underline"
            >
              {authorName}
            </a>
          </div>
          <p className="break-all font-mono text-xs text-muted-foreground">{authorNpub}</p>
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Kind</p>
          <p className="text-sm">{formatKind(assertion.kind)}</p>
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
          <p className="text-sm">{new Date(assertion.created_at * 1000).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Assertion content</p>
        <div className="min-w-0 rounded-md border p-3">
          <AssertionContentRenderer event={assertion} mode="full" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Associated attestations</p>
        {associatedAttestationsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading attestations...</p>
        ) : associatedAttestations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attestations found for this assertion yet.</p>
        ) : (
          <div className="space-y-2">
            {associatedAttestations.map((attestation) => (
              <AssociatedAttestationRow
                key={attestation.id}
                attestation={attestation}
                trustReason={trustedAttestorReasons.get(attestation.pubkey)}
              />
            ))}
          </div>
        )}
      </div>

      <CommentsSection root={assertion} title="Comments" />

      <AttestAssertionDialog
        assertionEvent={assertion}
        open={attestDialogOpen}
        onOpenChange={setAttestDialogOpen}
      />

      <RequestAssertionDialog
        assertionEvent={assertion}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />
    </div>
  );
}

function AssociatedAttestationRow({
  attestation,
  trustReason,
}: {
  attestation: NostrEvent;
  trustReason?: {
    attestorPubkey: string;
    viaDirectList: boolean;
    providerPubkeys: string[];
  };
}) {
  const attestor = useAuthor(attestation.pubkey);
  const attestorName = getNostrDisplayName(attestor.data?.metadata, attestation.pubkey);
  const attestorAvatar = attestor.data?.metadata?.picture;
  const parsed = parseAttestation(attestation);

  return (
    <Link
      to={`/attestations/${encodeEventPointer(attestation)}`}
      className="block rounded-md border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-6 w-6 border border-slate-200">
            <AvatarImage src={attestorAvatar} alt={attestorName} />
            <AvatarFallback className="text-[9px]">{attestorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="truncate text-xs font-medium text-slate-800">{attestorName}</p>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(attestation.created_at * 1000).toLocaleString()}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <AttestationStatusBadge status={parsed.status} />
        {trustReason ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="cursor-help bg-emerald-600 text-white hover:bg-emerald-600">Trusted for this kind</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  {trustReason.viaDirectList ? <p>Direct trusted list</p> : null}
                  {trustReason.providerPubkeys.length > 0 ? (
                    <div>
                      <p>Delegated provider{trustReason.providerPubkeys.length > 1 ? 's' : ''}:</p>
                      {trustReason.providerPubkeys.map((providerPubkey) => (
                        <p key={providerPubkey} className="font-mono text-[11px]">{providerPubkey}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
    </Link>
  );
}

function dedupeById(events: NostrEvent[]): NostrEvent[] {
  const seen = new Set<string>();
  const unique: NostrEvent[] = [];

  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }

  return unique;
}
