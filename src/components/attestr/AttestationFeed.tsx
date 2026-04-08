import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttestationFeed, type AttestationFeedFilters } from '@/hooks/useAttestationFeed';
import { parseAttestation } from '@/lib/attestation';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { getProfilePath } from '@/lib/nostrEncodings';
import { AttestationDetailSheet } from './AttestationDetailSheet';
import { AttestationCardStats } from './AttestationCardStats';
import { ZapButton } from '@/components/ZapButton';
import { getKindName } from '@/lib/nostrKinds';
import { AttestationStatusBadge } from './AttestationStatusBadge';
import { AssertionContentRenderer } from './AssertionContentRenderer';

interface AttestationFeedProps {
  filters: AttestationFeedFilters;
  runKey?: number;
}

export function AttestationFeed({ filters, runKey = 0 }: AttestationFeedProps) {
  const { data: attestations = [], isLoading, refetch } = useAttestationFeed(filters, runKey);
  const { data: assertionData } = useAssertionEvents(attestations);

  const filteredAttestations = filters.assertionKinds.length > 0 && assertionData
    ? attestations.filter((attestation) => {
        const parsed = parseAttestation(attestation);
        if (!parsed.assertionRef) return false;
        const assertion = parsed.assertionRef.type === 'e'
          ? assertionData.byId[parsed.assertionRef.value]
          : parsed.assertionRef.type === 'a'
            ? assertionData.byAddress[parsed.assertionRef.value]
            : undefined;
        return assertion ? filters.assertionKinds.includes(assertion.kind) : false;
      })
    : attestations;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredAttestations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          No attestations found for the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {filteredAttestations.map((attestation) => {
        const parsed = parseAttestation(attestation);
        const assertion = parsed.assertionRef
          ? parsed.assertionRef.type === 'e'
            ? assertionData?.byId[parsed.assertionRef.value]
            : parsed.assertionRef.type === 'a'
              ? assertionData?.byAddress[parsed.assertionRef.value]
              : undefined
          : undefined;

        return (
          <AttestationCard
            key={attestation.id}
            event={attestation}
            assertion={assertion}
            onUpdated={refetch}
          />
        );
      })}
    </div>
  );
}

interface AttestationCardProps {
  event: NostrEvent;
  assertion?: NostrEvent;
  onUpdated: () => Promise<unknown>;
}

function AttestationCard({ event, assertion, onUpdated }: AttestationCardProps) {
  const parsed = parseAttestation(event);
  const attestor = useAuthor(event.pubkey);
  const asserter = useAuthor(assertion?.pubkey ?? '');
  const attestorName = getNostrDisplayName(attestor.data?.metadata, event.pubkey);
  const attestorAvatar = attestor.data?.metadata?.picture;
  const asserterName = assertion ? getNostrDisplayName(asserter.data?.metadata, assertion.pubkey) : 'Unknown author';
  const asserterAvatar = assertion ? asserter.data?.metadata?.picture : undefined;
  const assertionKindLabel = assertion ? (getKindName(assertion.kind) ?? 'Unkown') : 'Event reference';
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<'overview' | 'zaps' | 'comments'>('overview');

  const openDetailAt = (section: 'overview' | 'zaps' | 'comments') => {
    setInitialSection(section);
    setIsDetailOpen(true);
  };

  return (
    <>
    <Card
      className="cursor-pointer border-slate-200 bg-white/90 shadow-sm transition hover:border-slate-300 hover:bg-white"
      onClick={() => setIsDetailOpen(true)}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarImage src={attestorAvatar} alt={attestorName} />
              <AvatarFallback className="text-[10px]">{attestorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <a href={getProfilePath(event.pubkey)} className="truncate text-sm font-medium text-slate-900 hover:underline">
              {attestorName}
            </a>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(event.created_at * 1000).toLocaleString()}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="line-clamp-2 text-sm text-slate-700">{event.content.trim() || 'No attestation message.'}</p>

          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-2">
              <AttestationStatusBadge status={parsed.status} />
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 border border-slate-200">
                  <AvatarImage src={asserterAvatar} alt={asserterName} />
                  <AvatarFallback className="text-[9px]">{asserterName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {assertion ? (
                  <a
                    href={getProfilePath(assertion.pubkey)}
                    className="truncate text-xs font-medium text-slate-800 hover:underline"
                  >
                    {asserterName}
                  </a>
                ) : (
                  <p className="truncate text-xs font-medium text-slate-800">{asserterName}</p>
                )}
              </div>
              <Badge variant="outline" className="max-w-[45%] truncate text-[10px] font-medium">{assertionKindLabel}</Badge>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              {assertion ? (
                <AssertionContentRenderer event={assertion} mode="summary" />
              ) : (
                <p className="line-clamp-2">Assertion content unavailable.</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground break-words">
            Validity window: {parsed.validFrom ? new Date(parsed.validFrom * 1000).toLocaleString() : 'open'} - {parsed.validTo ? new Date(parsed.validTo * 1000).toLocaleString() : 'open'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AttestationCardStats
            event={event}
            onCommentsClick={() => openDetailAt('comments')}
            onZapsClick={() => openDetailAt('zaps')}
          />

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <div onClick={(event) => event.stopPropagation()}>
              <ZapButton target={event} className="text-xs" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <AttestationDetailSheet
      attestation={event}
      assertion={assertion}
      onUpdated={onUpdated}
      open={isDetailOpen}
      onDialogOpenChange={setIsDetailOpen}
      initialSection={initialSection}
    />
    </>
  );
}
