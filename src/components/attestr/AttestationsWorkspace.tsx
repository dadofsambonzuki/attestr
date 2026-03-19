import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttestationFeed } from './AttestationFeed';

const statusOptions = ['all', 'accepted', 'rejected', 'verifying', 'verified', 'revoked'] as const;
const assertionKindOptions = [
  { label: 'Any kind', value: 'any' },
  { label: 'Kind 1 (Short Text Note)', value: '1' },
  { label: 'Kind 0 (Profile Metadata)', value: '0' },
  { label: 'Kind 3 (Contacts)', value: '3' },
  { label: 'Kind 6 (Repost)', value: '6' },
  { label: 'Kind 30023 (Long-form Article)', value: '30023' },
];

export function AttestationsWorkspace() {
  const [attestorInput, setAttestorInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assertionKindInput, setAssertionKindInput] = useState('any');

  const [runKey, setRunKey] = useState(0);

  const feedFilters = useMemo(() => {
    return {
      attestor: attestorInput.trim(),
      status: statusFilter === 'all' ? '' : statusFilter,
      assertionKind: assertionKindInput === 'any' ? undefined : Number.parseInt(assertionKindInput, 10),
    };
  }, [attestorInput, statusFilter, assertionKindInput]);

  return (
    <section className="space-y-6" id="attestations-workspace">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Filter attestations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="attestations-attestor">Attestor</Label>
              <Input
                id="attestations-attestor"
                value={attestorInput}
                onChange={(e) => setAttestorInput(e.target.value)}
                placeholder="npub / NIP-05 / hex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attestations-status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="attestations-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attestations-kind">Assertion kind</Label>
              <Select value={assertionKindInput} onValueChange={setAssertionKindInput}>
                <SelectTrigger id="attestations-kind">
                  <SelectValue placeholder="Any kind" />
                </SelectTrigger>
                <SelectContent>
                  {assertionKindOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => setRunKey((k) => k + 1)}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2" id="attestation-feed">
        <h2 className="text-2xl font-semibold tracking-tight">Attestations</h2>
        <p className="text-sm text-muted-foreground">
          Newest first. Open any card to inspect lifecycle metadata, linked assertion details, comments, and zaps.
        </p>
      </div>

      <AttestationFeed filters={feedFilters} runKey={runKey} />
    </section>
  );
}
