import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatKind, getNostrKindOptions } from '@/lib/nostrKinds';

interface KindTagSelectorProps {
  id: string;
  label: string;
  pickerValue: string;
  onPickerChange: (value: string) => void;
  selectedKinds: number[];
  onAdd: () => void;
  onRemove: (kind: number) => void;
}

const kindOptions = [
  { label: 'Select kind', value: 'any' },
  ...getNostrKindOptions(),
];

export function KindTagSelector({
  id,
  label,
  pickerValue,
  onPickerChange,
  selectedKinds,
  onAdd,
  onRemove,
}: KindTagSelectorProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-2">
        <Select value={pickerValue} onValueChange={onPickerChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select kind" />
          </SelectTrigger>
          <SelectContent>
            {kindOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={onAdd}>Add</Button>
      </div>

      <div className="flex min-h-8 flex-wrap gap-2">
        {selectedKinds.length === 0 ? (
          <p className="text-xs text-muted-foreground">No kinds selected yet.</p>
        ) : (
          selectedKinds.map((kind) => (
            <Badge key={kind} variant="secondary" className="gap-1 pl-2 pr-1">
              <span className="max-w-[220px] truncate">{formatKind(kind)}</span>
              <button
                type="button"
                onClick={() => onRemove(kind)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted-foreground/15"
                aria-label={`Remove kind ${kind}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
