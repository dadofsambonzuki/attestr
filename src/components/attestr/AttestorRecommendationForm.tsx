import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { ATTESTOR_RECOMMENDATION_KIND, createAttestorRecommendationD } from '@/lib/attestation';
import { KindTagSelector } from './KindTagSelector';
import { SignerMismatchWarning } from '@/components/SignerMismatchWarning';

interface AttestorRecommendationFormProps {
  recommendedAttestorPubkey: string;
  onPublished?: () => void;
  embedded?: boolean;
}

export function AttestorRecommendationForm({
  recommendedAttestorPubkey,
  onPublished,
  embedded = false,
}: AttestorRecommendationFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [kindPickerValue, setKindPickerValue] = useState<string>('any');
  const [selectedKinds, setSelectedKinds] = useState<number[]>([]);

  const canSubmit = Boolean(user && selectedKinds.length > 0);

  const handlePublish = async () => {
    if (!canSubmit || !user) return;

    const d = createAttestorRecommendationD(user.pubkey, recommendedAttestorPubkey);
    const tags: string[][] = [
      ['d', d],
      ['p', recommendedAttestorPubkey],
      ...selectedKinds.map((kind) => ['k', String(kind)]),
    ];

    try {
      await publishEvent({
        kind: ATTESTOR_RECOMMENDATION_KIND,
        tags,
        content: '',
      });

      toast({
        title: 'Recommendation published',
        description: 'Your attestor recommendation is now on relays.',
      });
      setSelectedKinds([]);
      onPublished?.();
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Could not publish recommendation.',
        variant: 'destructive',
      });
    }
  };

  const body = (
    <div className="space-y-5">
      {!user ? (
        <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
          <p className="text-muted-foreground">Log in to recommend attestors.</p>
          <LoginArea />
        </div>
      ) : null}

      <SignerMismatchWarning />

      <KindTagSelector
        id="recommendation-kinds"
        label="Assertion kinds this attestor is recommended for"
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

      <Button className="w-full gap-2" disabled={!canSubmit || isPending} onClick={handlePublish}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Publish recommendation
      </Button>
    </div>
  );

  if (embedded) return body;
  return <div className="space-y-5">{body}</div>;
}
