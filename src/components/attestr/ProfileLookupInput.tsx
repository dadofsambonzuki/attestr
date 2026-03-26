import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfileLookup } from '@/hooks/useProfileLookup';

interface ProfileLookupInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelectPubkey: (pubkey: string) => void;
  placeholder?: string;
}

export function ProfileLookupInput({
  id,
  value,
  onValueChange,
  onSelectPubkey,
  placeholder,
}: ProfileLookupInputProps) {
  const lookup = useProfileLookup(value);
  const options = lookup.data ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      {value.trim().length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white p-1">
          {lookup.isFetching ? (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching profiles...
            </div>
          ) : options.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No matching profile found yet.</p>
          ) : (
            options.map((option) => (
              <Button
                key={option.pubkey}
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-left"
                onClick={() => onSelectPubkey(option.pubkey)}
              >
                <span className="truncate text-xs font-medium text-slate-800">{option.label}</span>
              </Button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
