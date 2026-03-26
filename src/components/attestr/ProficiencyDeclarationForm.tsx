import { useMemo, useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import {
  ATTESTOR_PROFICIENCY_DECLARATION_KIND,
  parseAttestorProficiencyDeclaration,
} from '@/lib/attestation';
import { KindTagSelector } from './KindTagSelector';

interface ProficiencyDeclarationFormProps {
  existing?: NostrEvent;
  onPublished?: () => void;
  embedded?: boolean;
}

export function ProficiencyDeclarationForm({ existing, onPublished, embedded = false }: ProficiencyDeclarationFormProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const initialKinds = useMemo(() => (
    existing ? parseAttestorProficiencyDeclaration(existing).kinds : []
  ), [existing]);

  const [kindPickerValue, setKindPickerValue] = useState<string>('any');
  const [selectedKinds, setSelectedKinds] = useState<number[]>(initialKinds);

  const canSubmit = Boolean(user && selectedKinds.length > 0);

  const handlePublish = async () => {
    if (!canSubmit) return;

    const tags: string[][] = selectedKinds.map((kind) => ['k', String(kind)]);

    try {
      await publishEvent({
        kind: ATTESTOR_PROFICIENCY_DECLARATION_KIND,
        tags,
        content: '',
      });

      toast({
        title: 'Proficiency declaration saved',
        description: 'Your replaceable declaration is published on relays.',
      });
      onPublished?.();
    } catch (error) {
      toast({
        title: 'Publish failed',
        description: error instanceof Error ? error.message : 'Could not publish declaration.',
        variant: 'destructive',
      });
    }
  };

  const body = (
    <div className="space-y-5">
      {!user ? (
        <div className="space-y-3 rounded-md border border-dashed p-4 text-sm">
          <p className="text-muted-foreground">Log in to edit your proficiency declaration.</p>
          <LoginArea />
        </div>
      ) : null}

      <KindTagSelector
        id="proficiency-kinds"
        label="Assertion kinds you can attest"
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
        Save proficiency declaration
      </Button>
    </div>
  );

  if (embedded) return body;
  return <div className="space-y-5">{body}</div>;
}
