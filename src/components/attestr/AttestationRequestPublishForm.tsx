import { useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoginArea } from '@/components/auth/LoginArea';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import {
  ATTESTATION_REQUEST_KIND,
  createAssertionTag,
  createAttestationRequestD,
} from '@/lib/attestation';
import { encodeNpub } from '@/lib/nostrEncodings';
import { resolveAuthorInput } from '@/lib/nostrIdentity';
import { ProfileLookupInput } from './ProfileLookupInput';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { SignerMismatchWarning } from '@/components/SignerMismatchWarning';

interface AttestationRequestPublishFormProps {
  assertionEvent?: NostrEvent;
  onPublished?: () => void;
  embedded?: boolean;
}

export function AttestationRequestPublishForm({
  assertionEvent,
  onPublished,
  embedded = false,
}: AttestationRequestPublishFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [requestMessage, setRequestMessage] = useState('');
  const [attestorInput, setAttestorInput] = useState('');
  const [requestedAttestors, setRequestedAttestors] = useState<string[]>([]);

  const canSubmit = Boolean(user && assertionEvent);
  const requestorNpub = useMemo(() => (user ? encodeNpub(user.pubkey) : null), [user]);

  const handlePublish = async () => {
    if (!user || !assertionEvent) {
      toast({
        title: 'No assertion selected',
        description: 'Choose an assertion event before publishing a request.',
        variant: 'destructive',
      });
      return;
    }

    const d = createAttestationRequestD(user.pubkey, assertionEvent);

    const tags: string[][] = [
      ['d', d],
      createAssertionTag(assertionEvent),
      ...requestedAttestors.map((pubkey) => ['p', pubkey]),
    ];

    try {
      await publishEvent({
        kind: ATTESTATION_REQUEST_KIND,
        tags,
        content: requestMessage.trim(),
      });

      setRequestMessage('');
      setAttestorInput('');
      setRequestedAttestors([]);
      onPublished?.();
      toast({
        title: 'Request published',
        description: 'Your attestation request event is now on relays.',
      });
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Unable to publish attestation request.',
        variant: 'destructive',
      });
    }
  };

  const formBody = (
    <div className="space-y-5">
      {!user ? (
        <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
          <p className="text-muted-foreground">Log in to publish attestation requests.</p>
          <LoginArea />
        </div>
      ) : null}

      {requestorNpub ? (
        <p className="text-xs text-muted-foreground">
          Requestor: <span className="font-mono">{requestorNpub}</span>
        </p>
      ) : null}

      <SignerMismatchWarning />

      <div className="space-y-2">
        <Label htmlFor="request-attestor">Requested attestor (optional)</Label>
        <div className="space-y-2">
          <ProfileLookupInput
            id="request-attestor"
            value={attestorInput}
            onValueChange={setAttestorInput}
            placeholder="username, nip05, npub, or hex"
            onSelectPubkey={(pubkey) => {
              setRequestedAttestors((prev) => (prev.includes(pubkey) ? prev : [...prev, pubkey]));
              setAttestorInput('');
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const value = attestorInput.trim();
              if (!value) return;
              const resolved = await resolveAuthorInput(value);
              if (!resolved) {
                toast({
                  title: 'Invalid attestor identifier',
                  description: 'Enter a valid username, nip05, npub, or hex pubkey.',
                  variant: 'destructive',
                });
                return;
              }
              setRequestedAttestors((prev) => (prev.includes(resolved) ? prev : [...prev, resolved]));
              setAttestorInput('');
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {requestedAttestors.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {requestedAttestors.map((attestor) => (
            <RequestedAttestorPill
              key={attestor}
              pubkey={attestor}
              onRemove={() => setRequestedAttestors((prev) => prev.filter((item) => item !== attestor))}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="request-message">Request message</Label>
        <Textarea
          id="request-message"
          value={requestMessage}
          onChange={(e) => setRequestMessage(e.target.value)}
          placeholder="Describe what you want attested and why."
          className="min-h-[110px]"
        />
      </div>

      <Button disabled={!canSubmit || isPending} onClick={handlePublish} className="w-full gap-2">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Publish attestation request
      </Button>
    </div>
  );

  if (embedded) return formBody;
  return <div className="space-y-5">{formBody}</div>;
}

function RequestedAttestorPill({ pubkey, onRemove }: { pubkey: string; onRemove: () => void }) {
  const author = useAuthor(pubkey);
  const displayName = getNostrDisplayName(author.data?.metadata, pubkey);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onRemove}
      className="text-[11px]"
    >
      {displayName} ×
    </Button>
  );
}
