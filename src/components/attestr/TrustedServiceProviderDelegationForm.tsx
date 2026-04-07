import { useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import {
  TRUSTED_SERVICE_PROVIDERS_KIND,
  buildTrustedServiceProviderDelegationTag,
  parseTrustedServiceProviderDelegations,
  type ParsedTrustedServiceProviderDelegation,
} from '@/lib/attestation';
import { KindTagSelector } from './KindTagSelector';
import { ProfileLookupInput } from './ProfileLookupInput';
import { resolveAuthorInput } from '@/lib/nostrIdentity';
import { encodeNpub } from '@/lib/nostrEncodings';
import { SignerMismatchWarning } from '@/components/SignerMismatchWarning';

interface DelegationRow {
  providerPubkey: string;
  assertionKinds: number[];
  relayHint: string;
}

interface TrustedServiceProviderDelegationFormProps {
  existing?: NostrEvent;
  onPublished?: () => void;
  embedded?: boolean;
}

function groupDelegationsByProvider(entries: ParsedTrustedServiceProviderDelegation[]): DelegationRow[] {
  const grouped = new Map<string, { kinds: Set<number>; relayHint: string }>();

  for (const entry of entries) {
    const existing = grouped.get(entry.providerPubkey);
    if (!existing) {
      grouped.set(entry.providerPubkey, {
        kinds: new Set([entry.assertionKind]),
        relayHint: entry.relayHint ?? '',
      });
      continue;
    }

    existing.kinds.add(entry.assertionKind);
    if (!existing.relayHint && entry.relayHint) {
      existing.relayHint = entry.relayHint;
    }
  }

  return [...grouped.entries()]
    .map(([providerPubkey, state]) => ({
      providerPubkey,
      assertionKinds: [...state.kinds].sort((a, b) => a - b),
      relayHint: state.relayHint,
    }))
    .sort((a, b) => a.providerPubkey.localeCompare(b.providerPubkey));
}

export function TrustedServiceProviderDelegationForm({
  existing,
  onPublished,
  embedded = false,
}: TrustedServiceProviderDelegationFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const initialRows = useMemo(() => {
    if (!existing) return [];
    return groupDelegationsByProvider(parseTrustedServiceProviderDelegations(existing));
  }, [existing]);

  const [providerInput, setProviderInput] = useState('');
  const [selectedProviderPubkey, setSelectedProviderPubkey] = useState<string>('');
  const [relayHintInput, setRelayHintInput] = useState('');
  const [kindPickerValue, setKindPickerValue] = useState<string>('any');
  const [selectedKinds, setSelectedKinds] = useState<number[]>([]);
  const [rows, setRows] = useState<DelegationRow[]>(initialRows);

  const canAddProvider = Boolean(selectedProviderPubkey && selectedKinds.length > 0);
  const canSubmit = Boolean(user && rows.length > 0);

  const resetProviderDraft = () => {
    setProviderInput('');
    setSelectedProviderPubkey('');
    setRelayHintInput('');
    setKindPickerValue('any');
    setSelectedKinds([]);
  };

  const handleAddProvider = () => {
    if (!canAddProvider) return;

    setRows((prev) => {
      const existingIndex = prev.findIndex((row) => row.providerPubkey === selectedProviderPubkey);
      if (existingIndex === -1) {
        return [
          ...prev,
          {
            providerPubkey: selectedProviderPubkey,
            assertionKinds: [...selectedKinds].sort((a, b) => a - b),
            relayHint: relayHintInput.trim(),
          },
        ];
      }

      const next = [...prev];
      const row = next[existingIndex];
      const mergedKinds = new Set([...row.assertionKinds, ...selectedKinds]);
      next[existingIndex] = {
        providerPubkey: row.providerPubkey,
        assertionKinds: [...mergedKinds].sort((a, b) => a - b),
        relayHint: relayHintInput.trim() || row.relayHint,
      };
      return next;
    });

    resetProviderDraft();
  };

  const handlePublish = async () => {
    if (!canSubmit) return;

    const tags = rows.flatMap((row) =>
      row.assertionKinds.map((kind) => buildTrustedServiceProviderDelegationTag(kind, row.providerPubkey, row.relayHint || undefined)),
    );

    try {
      await publishEvent({
        kind: TRUSTED_SERVICE_PROVIDERS_KIND,
        tags,
        content: '',
      });

      toast({
        title: 'Trusted providers updated',
        description: 'Your kind 10040 delegation list has been published.',
      });
      onPublished?.();
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Could not publish trusted providers list.',
        variant: 'destructive',
      });
    }
  };

  const body = (
    <div className="space-y-5">
      {!user ? (
        <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
          <p className="text-muted-foreground">Log in to edit your trusted provider delegations.</p>
          <LoginArea />
        </div>
      ) : null}

      <SignerMismatchWarning />

      <div className="space-y-2">
        <Label htmlFor="trusted-provider-input">Trusted service provider</Label>
        <ProfileLookupInput
          id="trusted-provider-input"
          value={providerInput}
          onValueChange={setProviderInput}
          placeholder="username, nip05, npub, or hex"
          onSelectPubkey={(pubkey) => {
            setSelectedProviderPubkey(pubkey);
            setProviderInput(pubkey);
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const value = providerInput.trim();
              if (!value) return;
              const resolved = await resolveAuthorInput(value);
              if (!resolved) {
                toast({
                  title: 'Invalid provider identifier',
                  description: 'Enter a valid username, nip05, npub, or hex pubkey.',
                  variant: 'destructive',
                });
                return;
              }
              setSelectedProviderPubkey(resolved);
              setProviderInput(resolved);
            }}
          >
            Resolve provider
          </Button>
          {selectedProviderPubkey ? (
            <div className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              {encodeNpub(selectedProviderPubkey)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trusted-provider-relay">Relay hint (optional)</Label>
        <Input
          id="trusted-provider-relay"
          value={relayHintInput}
          onChange={(event) => setRelayHintInput(event.target.value)}
          placeholder="wss://relay.example.com"
        />
      </div>

      <KindTagSelector
        id="trusted-provider-kinds"
        label="Assertion kinds this provider may publish lists for"
        pickerValue={kindPickerValue}
        onPickerChange={setKindPickerValue}
        selectedKinds={selectedKinds}
        onAdd={() => {
          if (kindPickerValue === 'any') return;
          const parsed = Number.parseInt(kindPickerValue, 10);
          if (!Number.isFinite(parsed)) return;
          setSelectedKinds((prev) => (prev.includes(parsed) ? prev : [...prev, parsed].sort((a, b) => a - b)));
        }}
        onRemove={(kind) => setSelectedKinds((prev) => prev.filter((item) => item !== kind))}
      />

      <Button type="button" variant="outline" onClick={handleAddProvider} disabled={!canAddProvider}>
        Add trusted provider delegation
      </Button>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-xs font-medium text-slate-700">Delegations to publish (kind 10040)</p>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No provider delegations added yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.providerPubkey} className="rounded border bg-muted/20 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-xs">{encodeNpub(row.providerPubkey)}</code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((prev) => prev.filter((item) => item.providerPubkey !== row.providerPubkey))}
                >
                  Remove
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Kinds: {row.assertionKinds.join(', ')}</p>
              {row.relayHint ? <p className="text-xs text-muted-foreground">Relay: {row.relayHint}</p> : null}
            </div>
          ))
        )}
      </div>

      <Button className="w-full gap-2" disabled={!canSubmit || isPending} onClick={handlePublish}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save trusted service providers
      </Button>
    </div>
  );

  if (embedded) return body;
  return <div className="space-y-5">{body}</div>;
}
