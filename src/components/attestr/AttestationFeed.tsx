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

interface AttestationFeedProps {
  filters: AttestationFeedFilters;
  runKey?: number;
}

export function AttestationFeed({ filters, runKey = 0 }: AttestationFeedProps) {
  const { data: attestations = [], isLoading, refetch } = useAttestationFeed(filters, runKey);
  const { data: assertionData } = useAssertionEvents(attestations);

  const filteredAttestations = filters.assertionKind && assertionData
    ? attestations.filter((attestation) => {
        const parsed = parseAttestation(attestation);
        if (!parsed.assertionRef) return false;
        const assertion = parsed.assertionRef.type === 'e'
          ? assertionData.byId[parsed.assertionRef.value]
          : parsed.assertionRef.type === 'a'
            ? assertionData.byAddress[parsed.assertionRef.value]
            : undefined;
        return assertion?.kind === filters.assertionKind;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <p className="text-sm font-medium">Attestor {event.pubkey.slice(0, 12)}…</p>
          <p className="text-xs text-muted-foreground">{new Date(event.created_at * 1000).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{parsed.status ?? 'unknown'}</Badge>
          {parsed.validity ? <Badge variant="secondary">{parsed.validity}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-1 text-sm">
          <p>
            Assertion kind: <span className="font-medium">{assertion?.kind ?? 'Unknown'}</span>
          </p>
          <p className="text-muted-foreground">
            Assertion ref: {parsed.assertionRef ? `${parsed.assertionRef.type}:${parsed.assertionRef.value.slice(0, 32)}...` : 'Missing'}
          </p>
          <p className="text-muted-foreground">
            Validity window: {parsed.validFrom ? new Date(parsed.validFrom * 1000).toLocaleString() : 'open'} - {parsed.validTo ? new Date(parsed.validTo * 1000).toLocaleString() : 'open'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <AttestationCardStats event={event} />

          <AttestationDetailSheet attestation={event} assertion={assertion} onUpdated={onUpdated}>
            <Button variant="outline" size="sm">Open details</Button>
          </AttestationDetailSheet>
        </div>
      </CardContent>
    </Card>
  );
}
