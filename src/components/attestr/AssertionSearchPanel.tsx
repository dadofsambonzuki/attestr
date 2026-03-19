import { useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventSearch } from '@/hooks/useEventSearch';
import { AttestAssertionDialog } from './AttestAssertionDialog';

interface AssertionSearchPanelProps {
  selected?: NostrEvent;
  onSelect: (event: NostrEvent) => void;
}

const timeRanges = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
];

export function AssertionSearchPanel({
  selected,
  onSelect,
}: AssertionSearchPanelProps) {
  const [queryInput, setQueryInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [kindInput, setKindInput] = useState('');
  const [days, setDays] = useState(30);
  const [attestTarget, setAttestTarget] = useState<NostrEvent | undefined>();
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);

  const params = useMemo(() => {
    const parsedKind = Number.parseInt(kindInput, 10);
    return {
      query: queryInput,
      author: authorInput,
      kind: Number.isFinite(parsedKind) ? parsedKind : undefined,
      days,
      limit: 40,
    };
  }, [authorInput, days, kindInput, queryInput]);

  const { data: events = [], isLoading, refetch } = useEventSearch(params);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search assertion events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="search-query">Query</Label>
            <Input
              id="search-query"
              placeholder="Search content, note1/nevent1/naddr1, or event hex"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-author">Author</Label>
            <Input
              id="search-author"
              placeholder="nip05 / npub / hex"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-kind">Kind filter</Label>
            <Input
              id="search-kind"
              type="number"
              placeholder="Any kind"
              value={kindInput}
              onChange={(e) => setKindInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-3">
          <div className="flex items-center gap-3">
            <Label htmlFor="search-window">Time window</Label>
            <Select value={`${days}`} onValueChange={(value) => setDays(Number.parseInt(value, 10))}>
              <SelectTrigger id="search-window" className="w-36">
                <SelectValue placeholder="Select window" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={`${range.value}`}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <Button variant="outline" onClick={() => refetch()}>
              Run search
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Searching relays...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assertion events found yet.</p>
          ) : (
            events.map((event) => {
              const isSelected = selected?.id === event.id;
              return (
                <button
                  key={event.id}
                  type="button"
                  className={`w-full rounded-md border p-3 text-left transition ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                  onClick={() => onSelect(event)}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>kind {event.kind}</span>
                    <span>•</span>
                    <span>{new Date(event.created_at * 1000).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-mono">{event.id.slice(0, 16)}...</span>
                  </div>

                  <p className="mt-2 text-sm break-words">{event.content || 'No content'}</p>

                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={(buttonEvent) => {
                        buttonEvent.stopPropagation();
                        onSelect(event);
                        setAttestTarget(event);
                        setAttestDialogOpen(true);
                      }}
                    >
                      Attest
                    </Button>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <AttestAssertionDialog
          assertionEvent={attestTarget}
          open={attestDialogOpen}
          onOpenChange={setAttestDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
