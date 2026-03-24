import { useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEventSearch } from '@/hooks/useEventSearch';
import { encodeEventPointer, encodeNpub } from '@/lib/nostrEncodings';
import { AttestAssertionDialog } from './AttestAssertionDialog';
import { NostrName } from '@/components/nostr/NostrName';
import { AssertionDetailDialog } from './AssertionDetailDialog';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestrSearchFilters } from './AttestrSearchFilters';

interface AssertionSearchPanelProps {
  onSelect?: (event: NostrEvent) => void;
}

const timeRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
];

export function AssertionSearchPanel({
  onSelect,
}: AssertionSearchPanelProps) {
  const [queryInput, setQueryInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [kindInput, setKindInput] = useState('any');
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [attestTarget, setAttestTarget] = useState<NostrEvent | undefined>();
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);

  const params = useMemo(() => {
    const kinds = selectedKinds
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    return {
      query: queryInput,
      authors: selectedAuthors,
      kinds,
      days,
      limit: 40,
    };
  }, [days, queryInput, selectedAuthors, selectedKinds]);

  const { data: events = [], isLoading, refetch } = useEventSearch(params);

  return (
    <div className="space-y-4">
    <AttestrSearchFilters
      title="Search assertion events"
      onSubmit={() => refetch()}
      query={{
        id: 'search-query',
        label: 'Query',
        value: queryInput,
        onChange: setQueryInput,
        placeholder: 'Search content, note1/nevent1/naddr1, or event hex',
        defaultValue: '',
        pillLabel: 'Query',
      }}
      author={{
        id: 'search-author',
        label: 'Author',
        inputValue: authorInput,
        onInputChange: setAuthorInput,
        onAdd: () => {
          const value = authorInput.trim();
          if (!value) return;
          setSelectedAuthors((prev) => (prev.includes(value) ? prev : [...prev, value]));
          setAuthorInput('');
        },
        selectedValues: selectedAuthors,
        onRemove: (value) => setSelectedAuthors((prev) => prev.filter((item) => item !== value)),
        placeholder: 'nip05 / npub / hex',
        pillLabel: (value) => `Author: ${value}`,
      }}
      kind={{
        id: 'search-kind',
        label: 'Kind',
        pickerValue: kindInput,
        onPickerChange: setKindInput,
        onAdd: () => {
          if (kindInput === 'any') return;
          setSelectedKinds((prev) => (prev.includes(kindInput) ? prev : [...prev, kindInput]));
        },
        selectedValues: selectedKinds,
        onRemove: (value) => setSelectedKinds((prev) => prev.filter((item) => item !== value)),
        options: [
          { label: 'Any kind', value: 'any' },
          { label: 'Kind 1 (Short Text Note)', value: '1' },
          { label: 'Kind 0 (Profile Metadata)', value: '0' },
          { label: 'Kind 3 (Contacts)', value: '3' },
          { label: 'Kind 6 (Repost)', value: '6' },
          { label: 'Kind 30023 (Long-form Article)', value: '30023' },
        ],
        pillLabel: (value) => `Kind: ${value}`,
      }}
      days={{
        id: 'search-window',
        label: 'Time window',
        value: `${days}`,
        onChange: (value) => setDays(Number.parseInt(value, 10)),
        defaultValue: '30',
        options: timeRanges.map((range) => ({ label: range.label, value: `${range.value}` })),
        pillLabel: (value) => `Window: ${value}d`,
      }}
    />

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Searching relays...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assertion events found yet.</p>
          ) : (
            events.map((event) => {
              const pointer = encodeEventPointer(event);
              const npub = encodeNpub(event.pubkey);

              return (
                <Card key={event.id}>
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Kind {event.kind}</span>
                      <span>•</span>
                      <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground break-all">{pointer}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Author</p>
                      <p className="text-sm font-medium"><NostrName pubkey={event.pubkey} /></p>
                      <p className="font-mono text-xs text-muted-foreground break-all">{npub}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
                      <AssertionContentRenderer event={event} mode="summary" />
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-end gap-2">
                      <AssertionDetailDialog assertion={event}>
                        <Button variant="outline" size="sm">Open details</Button>
                      </AssertionDetailDialog>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          onSelect?.(event);
                          setAttestTarget(event);
                          setAttestDialogOpen(true);
                        }}
                      >
                        Attest
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <AttestAssertionDialog
          assertionEvent={attestTarget}
          open={attestDialogOpen}
          onOpenChange={setAttestDialogOpen}
        />
      </div>
  );
}
