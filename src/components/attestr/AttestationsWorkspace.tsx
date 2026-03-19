import { useMemo, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AttestationFeed } from './AttestationFeed';

const statusOptions = ['all', 'accepted', 'rejected', 'verifying', 'verified', 'revoked'] as const;

export function AttestationsWorkspace() {
  const [attestorFilter, setAttestorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const feedFilters = useMemo(() => {
    return {
      attestor: attestorFilter.trim(),
      status: statusFilter === 'all' ? '' : statusFilter,
    };
  }, [attestorFilter, statusFilter]);

  return (
    <section className="space-y-6" id="attestations-workspace">
      <Card>
        <CardContent className="space-y-4 py-5">
          <p className="text-sm font-medium">Attestation filters</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attestations-attestor">Attestor pubkey</Label>
              <Input
                id="attestations-attestor"
                value={attestorFilter}
                onChange={(e) => setAttestorFilter(e.target.value)}
                placeholder="Filter by attestor hex"
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
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2" id="attestation-feed">
        <h2 className="text-2xl font-semibold tracking-tight">Attestations</h2>
        <p className="text-sm text-muted-foreground">
          Newest first. Open any card to inspect lifecycle metadata, linked assertion details, comments, and zaps.
        </p>
      </div>

      <AttestationFeed filters={feedFilters} />
    </section>
  );
}
