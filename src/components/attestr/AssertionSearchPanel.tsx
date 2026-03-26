import { useEffect, useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEventSearch } from '@/hooks/useEventSearch';
import { useAuthor } from '@/hooks/useAuthor';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { getProfilePath } from '@/lib/nostrEncodings';
import { AttestAssertionDialog } from './AttestAssertionDialog';
import { RequestAssertionDialog } from './RequestAssertionDialog';
import { AssertionDetailDialog } from './AssertionDetailDialog';
import { AssertionContentRenderer } from './AssertionContentRenderer';
import { AttestrSearchFilters } from './AttestrSearchFilters';
import { formatKind, getKindName, getNostrKindOptions } from '@/lib/nostrKinds';

interface AssertionSearchPanelProps {
  onSelect?: (event: NostrEvent) => void;
  defaultAuthors?: string[];
  actionMode?: 'attest' | 'request' | 'both';
  onRequestPublished?: () => void;
}

const timeRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
];

export function AssertionSearchPanel({
  onSelect,
  defaultAuthors = [],
  actionMode = 'both',
  onRequestPublished,
}: AssertionSearchPanelProps) {
  const [queryInput, setQueryInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [kindInput, setKindInput] = useState('any');
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [attestTarget, setAttestTarget] = useState<NostrEvent | undefined>();
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<NostrEvent | undefined>();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    if (defaultAuthors.length === 0) return;

    setSelectedAuthors((prev) => {
      if (prev.length > 0) return prev;
      const deduped = new Set(defaultAuthors.map((value) => value.trim()).filter(Boolean));
      return [...deduped.values()];
    });
  }, [defaultAuthors]);

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
        title="Search Nostr events"
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
            ...getNostrKindOptions(),
          ],
          pillLabel: (value) => `Kind: ${formatKind(Number.parseInt(value, 10))}`,
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

      <div className="grid gap-3 xl:grid-cols-2">
        {isLoading ? (
          <p className="col-span-full text-sm text-muted-foreground">Searching relays...</p>
        ) : events.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">No assertion events found yet.</p>
        ) : (
          events.map((event) => {
            return (
              <AssertionResultCard
                key={event.id}
                event={event}
                onAttest={() => {
                  onSelect?.(event);
                  setAttestTarget(event);
                  setAttestDialogOpen(true);
                }}
                onRequest={() => {
                  onSelect?.(event);
                  setRequestTarget(event);
                  setRequestDialogOpen(true);
                }}
                actionMode={actionMode}
              />
            );
          })
        )}
      </div>

      <AttestAssertionDialog
        assertionEvent={attestTarget}
        open={attestDialogOpen}
        onOpenChange={setAttestDialogOpen}
      />

      <RequestAssertionDialog
        assertionEvent={requestTarget}
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onPublished={onRequestPublished}
      />
    </div>
  );
}

function AssertionResultCard({
  event,
  onAttest,
  onRequest,
  actionMode,
}: {
  event: NostrEvent;
  onAttest: () => void;
  onRequest: () => void;
  actionMode: 'attest' | 'request' | 'both';
}) {
  const author = useAuthor(event.pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, event.pubkey);
  const avatarUrl = author.data?.metadata?.picture;
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer border-slate-200 bg-white/90 shadow-sm transition hover:border-slate-300 hover:bg-white"
        onClick={() => setIsDetailOpen(true)}
      >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-8 w-8 border border-slate-200">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-[10px]">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <a
                href={getProfilePath(event.pubkey)}
                className="truncate text-sm font-medium text-slate-900 hover:underline"
              >
                {displayName}
              </a>
              <p className="truncate text-xs text-muted-foreground">{new Date(event.created_at * 1000).toLocaleString()}</p>
            </div>
          </div>
          <Badge variant="outline" className="max-w-[45%] truncate text-[10px] font-medium">
            {getKindName(event.kind) ?? 'Unkown'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AssertionContentRenderer event={event} mode="summary" />

        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onAttest();
            }}
            className={actionMode === 'request' ? 'hidden' : undefined}
          >
            Attest
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onRequest();
            }}
            className={actionMode === 'attest' ? 'hidden' : undefined}
          >
            Request
          </Button>
        </div>
      </CardContent>
      </Card>

      <AssertionDetailDialog
        assertion={event}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
