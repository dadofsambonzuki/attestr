import type { NostrEvent } from '@nostrify/nostrify';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { parseAttestorRecommendation } from '@/lib/attestation';
import { getProfilePath } from '@/lib/nostrEncodings';
import { formatKind } from '@/lib/nostrKinds';
import { getNostrDisplayName } from '@/lib/nostrDisplay';
import { EventDeletionRequestButton } from './EventDeletionRequestButton';
import { KindTagSelector } from './KindTagSelector';

interface AttestorRecommendationDetailDialogProps {
  recommendation: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function AttestorRecommendationDetailDialog({
  recommendation,
  open,
  onOpenChange,
  onUpdated,
}: AttestorRecommendationDetailDialogProps) {
  const parsed = useMemo(() => parseAttestorRecommendation(recommendation), [recommendation]);
  const recommender = useAuthor(recommendation.pubkey);
  const recommenderName = getNostrDisplayName(recommender.data?.metadata, recommendation.pubkey);
  const recommenderAvatar = recommender.data?.metadata?.picture;
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const canEdit = user?.pubkey === recommendation.pubkey;
  const [isEditing, setIsEditing] = useState(false);
  const [kindPickerValue, setKindPickerValue] = useState('any');
  const [selectedKinds, setSelectedKinds] = useState<number[]>(parsed.kinds);

  useEffect(() => {
    if (!open) return;
    setIsEditing(false);
    setKindPickerValue('any');
    setSelectedKinds(parsed.kinds);
  }, [open, parsed.kinds, recommendation.id]);

  const recommendedAttestorPubkey = useMemo(
    () => parsed.recommendedAttestor ?? recommendation.tags.find(([name]) => name === 'p')?.[1],
    [parsed.recommendedAttestor, recommendation.tags],
  );

  const handleSave = async () => {
    if (!canEdit || !parsed.d || !recommendedAttestorPubkey || selectedKinds.length === 0) return;

    const tags: string[][] = [
      ['d', parsed.d],
      ['p', recommendedAttestorPubkey],
      ...selectedKinds.map((kind) => ['k', `${kind}`]),
    ];

    try {
      await publishEvent({
        kind: recommendation.kind,
        tags,
        content: recommendation.content,
      });

      toast({
        title: 'Recommendation updated',
        description: 'Your updated recommendation is now on relays.',
      });
      setIsEditing(false);
      onUpdated?.();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update recommendation.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recommendation details</DialogTitle>
          <DialogDescription>
            Review who recommended this attestor and the kinds included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6 border border-slate-200">
                  <AvatarImage src={recommenderAvatar} alt={recommenderName} />
                  <AvatarFallback className="text-[9px]">{recommenderName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <a href={getProfilePath(recommendation.pubkey)} className="truncate text-xs font-medium text-slate-800 hover:underline">
                  {recommenderName}
                </a>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(recommendation.created_at * 1000).toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {parsed.kinds.length > 0 ? (
                parsed.kinds.map((kind) => (
                  <Badge key={kind} variant="secondary">{formatKind(kind)}</Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No kind tags.</p>
              )}
            </div>
          </div>

          {canEdit ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing((v) => !v)}>
                  {isEditing ? 'Cancel edit' : 'Edit recommendation'}
                </Button>
                <EventDeletionRequestButton event={recommendation} onRequested={onUpdated} />
              </div>

              {isEditing ? (
                <>
                  <KindTagSelector
                    id={`recommendation-kinds-${recommendation.id}`}
                    label="Assertion kinds this attestor is recommended for"
                    pickerValue={kindPickerValue}
                    onPickerChange={setKindPickerValue}
                    selectedKinds={selectedKinds}
                    onAdd={() => {
                      if (kindPickerValue === 'any') return;
                      const parsedKind = Number.parseInt(kindPickerValue, 10);
                      if (!Number.isFinite(parsedKind)) return;
                      setSelectedKinds((prev) => (prev.includes(parsedKind)
                        ? prev
                        : [...prev, parsedKind].sort((a, b) => a - b)));
                    }}
                    onRemove={(kind) => setSelectedKinds((prev) => prev.filter((item) => item !== kind))}
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending || selectedKinds.length === 0 || !parsed.d || !recommendedAttestorPubkey}
                    onClick={handleSave}
                  >
                    {isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
