import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttestationFeed, type AttestationFeedFilters } from '@/hooks/useAttestationFeed';
import { parseAttestation } from '@/lib/attestation';
import { useAssertionEvents } from '@/hooks/useAssertionEvents';
import { AttestationDetailSheet } from './AttestationDetailSheet';
import { AttestationCardStats } from './AttestationCardStats';
import { NostrName } from '@/components/nostr/NostrName';
import { encodeAssertionRef, encodeEventPointer, encodeNpub } from '@/lib/nostrEncodings';
import { ZapButton } from '@/components/ZapButton';

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
    <div className="space-y-4">
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
  const attestorNpub = encodeNpub(event.pubkey);
  const attestationPointer = encodeEventPointer(event);
  const assertionRef = parsed.assertionRef ? encodeAssertionRef(parsed.assertionRef) : 'Missing';
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [initialSection, setInitialSection] = useState<'overview' | 'zaps' | 'comments'>('overview');

  const openDetailAt = (section: 'overview' | 'zaps' | 'comments') => {
    setInitialSection(section);
    setIsDetailOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">Attestor <NostrName pubkey={event.pubkey} /></p>
          <p className="font-mono text-xs text-muted-foreground break-all">{attestorNpub}</p>
          <p className="text-xs text-muted-foreground">{new Date(event.created_at * 1000).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{parsed.status ?? 'unknown'}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid min-w-0 gap-1 text-sm">
          <p>
            Assertion kind: <span className="font-medium">{assertion?.kind ?? 'Unknown'}</span>
          </p>
          <p className="break-all text-muted-foreground">
            Assertion ref: <span className="font-mono">{assertionRef}</span>
          </p>
          <p className="text-muted-foreground break-words">
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
            <ZapButton target={event} className="text-xs" />
            <Button asChild variant="ghost" size="sm">
              <a href={`/attestations/${attestationPointer}`}>Permalink</a>
            </Button>
            <AttestationDetailSheet
              attestation={event}
              assertion={assertion}
              onUpdated={onUpdated}
              open={isDetailOpen}
              onDialogOpenChange={setIsDetailOpen}
              initialSection={initialSection}
            >
              <Button variant="outline" size="sm">Open details</Button>
            </AttestationDetailSheet>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
