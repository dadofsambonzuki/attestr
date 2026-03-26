import { useMemo, useState } from 'react';

import { AttestationFeed } from './AttestationFeed';
import { AttestrSearchFilters } from './AttestrSearchFilters';
import { formatKind, getNostrKindOptions } from '@/lib/nostrKinds';

const statusOptions = ['all', 'verifying', 'valid', 'invalid', 'revoked'] as const;
const timeWindowOptions = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: '365 days', value: '365' },
];
const assertionKindOptions = [
  { label: 'Any kind', value: 'any' },
  ...getNostrKindOptions(),
];

export function AttestationsWorkspace() {
  const [queryInput, setQueryInput] = useState('');
  const [attestorInput, setAttestorInput] = useState('');
  const [selectedAttestors, setSelectedAttestors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [assertionKindInput, setAssertionKindInput] = useState('any');
  const [selectedAssertionKinds, setSelectedAssertionKinds] = useState<string[]>([]);

  const [runKey, setRunKey] = useState(0);

  const feedFilters = useMemo(() => {
    const assertionKinds = selectedAssertionKinds
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    return {
      query: queryInput,
      attestors: selectedAttestors,
      statuses: selectedStatuses,
      assertionKinds,
      days,
    };
  }, [days, queryInput, selectedAssertionKinds, selectedAttestors, selectedStatuses]);

  return (
    <section className="space-y-6" id="attestations-workspace">
      <AttestrSearchFilters
        title="Search attestations"
        submitLabel="Run search"
        onSubmit={() => setRunKey((k) => k + 1)}
        query={{
          id: 'attestations-query',
          label: 'Query',
          value: queryInput,
          onChange: setQueryInput,
          placeholder: 'Search attestation content',
          defaultValue: '',
          pillLabel: 'Query',
        }}
        author={{
          id: 'attestations-attestor',
          label: 'Attestor',
          inputValue: attestorInput,
          onInputChange: setAttestorInput,
          onAdd: () => {
            const value = attestorInput.trim();
            if (!value) return;
            setSelectedAttestors((prev) => (prev.includes(value) ? prev : [...prev, value]));
            setAttestorInput('');
          },
          selectedValues: selectedAttestors,
          onRemove: (value) => setSelectedAttestors((prev) => prev.filter((item) => item !== value)),
          placeholder: 'npub / NIP-05 / hex',
          pillLabel: (value) => `Attestor: ${value}`,
        }}
        status={{
          id: 'attestations-status',
          label: 'Status',
          pickerValue: statusFilter,
          onPickerChange: setStatusFilter,
          onAdd: () => {
            if (statusFilter === 'all') return;
            setSelectedStatuses((prev) => (prev.includes(statusFilter) ? prev : [...prev, statusFilter]));
          },
          selectedValues: selectedStatuses,
          onRemove: (value) => setSelectedStatuses((prev) => prev.filter((item) => item !== value)),
          options: statusOptions.map((status) => ({ label: status, value: status })),
          pillLabel: (value) => `Status: ${value}`,
        }}
        days={{
          id: 'attestations-window',
          label: 'Time window',
          value: `${days}`,
          onChange: (value) => setDays(Number.parseInt(value, 10)),
          defaultValue: '30',
          options: timeWindowOptions,
          pillLabel: (value) => `Window: ${value}d`,
        }}
        kind={{
          id: 'attestations-kind',
          label: 'Assertion kind',
          pickerValue: assertionKindInput,
          onPickerChange: setAssertionKindInput,
          onAdd: () => {
            if (assertionKindInput === 'any') return;
            setSelectedAssertionKinds((prev) => (
              prev.includes(assertionKindInput) ? prev : [...prev, assertionKindInput]
            ));
          },
          selectedValues: selectedAssertionKinds,
          onRemove: (value) => setSelectedAssertionKinds((prev) => prev.filter((item) => item !== value)),
          options: assertionKindOptions,
          pillLabel: (value) => `Kind: ${formatKind(Number.parseInt(value, 10))}`,
        }}
      />

      <div className="space-y-6">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm" id="attestation-feed">
          <h2 className="text-2xl font-semibold tracking-tight">Attestations</h2>
          <p className="text-sm text-muted-foreground">
            Newest first. Open any card to inspect lifecycle metadata, linked assertion details, comments, and zaps.
          </p>
        </div>

        <AttestationFeed filters={feedFilters} runKey={runKey} />
      </div>
    </section>
  );
}
