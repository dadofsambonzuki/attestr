import { useMemo, useState } from 'react';

import { AttestationFeed } from './AttestationFeed';
import { AttestrSearchFilters } from './AttestrSearchFilters';

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
  const [selectedAttestors, setSelectedAttestors] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [assertionKindInput, setAssertionKindInput] = useState('any');
  const [selectedAssertionKinds, setSelectedAssertionKinds] = useState<string[]>([]);

  const [runKey, setRunKey] = useState(0);

  const feedFilters = useMemo(() => {
    const assertionKinds = selectedAssertionKinds
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    return {
      attestors: selectedAttestors,
      statuses: selectedStatuses,
      assertionKinds,
    };
  }, [selectedAssertionKinds, selectedAttestors, selectedStatuses]);

  return (
    <section className="space-y-6" id="attestations-workspace">
      <AttestrSearchFilters
        title="Filter attestations"
        submitLabel="Run search"
        onSubmit={() => setRunKey((k) => k + 1)}
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
          pillLabel: (value) => `Kind: ${value}`,
        }}
      />

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
