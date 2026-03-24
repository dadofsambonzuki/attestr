import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TextFilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  pillLabel: string;
}

interface MultiTextFilterConfig {
  id: string;
  label: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  selectedValues: string[];
  onRemove: (value: string) => void;
  placeholder?: string;
  pillLabel: (value: string) => string;
}

interface SelectFilterConfig {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  defaultValue: string;
  pillLabel: (value: string) => string;
}

interface MultiSelectFilterConfig {
  id: string;
  label: string;
  pickerValue: string;
  onPickerChange: (value: string) => void;
  onAdd: () => void;
  selectedValues: string[];
  onRemove: (value: string) => void;
  options: { label: string; value: string }[];
  pillLabel: (value: string) => string;
}

interface AttestrSearchFiltersProps {
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  query?: TextFilterConfig;
  author?: MultiTextFilterConfig;
  kind?: MultiSelectFilterConfig;
  status?: MultiSelectFilterConfig;
  days?: SelectFilterConfig;
}

export function AttestrSearchFilters({
  title,
  onSubmit,
  submitLabel = 'Run search',
  query,
  author,
  kind,
  status,
  days,
}: AttestrSearchFiltersProps) {
  const pills = [
    query && query.value.trim()
      ? { key: query.id, label: `${query.pillLabel}: ${query.value.trim()}`, clear: () => query.onChange(query.defaultValue ?? '') }
      : null,
    ...(author
      ? author.selectedValues.map((value) => ({
          key: `${author.id}-${value}`,
          label: author.pillLabel(value),
          clear: () => author.onRemove(value),
        }))
      : []),
    ...(kind
      ? kind.selectedValues.map((value) => ({
          key: `${kind.id}-${value}`,
          label: kind.pillLabel(value),
          clear: () => kind.onRemove(value),
        }))
      : []),
    ...(status
      ? status.selectedValues.map((value) => ({
          key: `${status.id}-${value}`,
          label: status.pillLabel(value),
          clear: () => status.onRemove(value),
        }))
      : []),
    days && days.value !== days.defaultValue
      ? { key: days.id, label: days.pillLabel(days.value), clear: () => days.onChange(days.defaultValue) }
      : null,
  ].filter((pill): pill is { key: string; label: string; clear: () => void } => Boolean(pill));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          {query ? (
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor={query.id}>{query.label}</Label>
              <Input
                id={query.id}
                value={query.value}
                onChange={(e) => query.onChange(e.target.value)}
                placeholder={query.placeholder}
              />
            </div>
          ) : null}

          {author ? (
            <div className="space-y-2">
              <Label htmlFor={author.id}>{author.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={author.id}
                  value={author.inputValue}
                  onChange={(e) => author.onInputChange(e.target.value)}
                  placeholder={author.placeholder}
                />
                <Button type="button" variant="outline" onClick={author.onAdd}>Add</Button>
              </div>
            </div>
          ) : null}

          {kind ? (
            <div className="space-y-2">
              <Label htmlFor={kind.id}>{kind.label}</Label>
              <div className="flex items-center gap-2">
              <Select value={kind.pickerValue} onValueChange={kind.onPickerChange}>
                <SelectTrigger id={kind.id}>
                  <SelectValue placeholder="Any kind" />
                </SelectTrigger>
                <SelectContent>
                  {kind.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={kind.onAdd}>Add</Button>
              </div>
            </div>
          ) : null}

          {status ? (
            <div className="space-y-2">
              <Label htmlFor={status.id}>{status.label}</Label>
              <div className="flex items-center gap-2">
              <Select value={status.pickerValue} onValueChange={status.onPickerChange}>
                <SelectTrigger id={status.id}>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  {status.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={status.onAdd}>Add</Button>
              </div>
            </div>
          ) : null}

          {days ? (
            <div className="space-y-2">
              <Label htmlFor={days.id}>{days.label}</Label>
              <Select value={days.value} onValueChange={days.onChange}>
                <SelectTrigger id={days.id}>
                  <SelectValue placeholder="Select window" />
                </SelectTrigger>
                <SelectContent>
                  {days.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {pills.length > 0 ? pills.map((pill) => (
              <Badge key={pill.key} variant="secondary" className="gap-1 pl-2 pr-1">
                <span className="max-w-[220px] truncate">{pill.label}</span>
                <button
                  type="button"
                  onClick={pill.clear}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted-foreground/15"
                  aria-label={`Clear ${pill.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )) : <p className="text-xs text-muted-foreground">No active filters</p>}
          </div>

          <Button variant="outline" onClick={onSubmit}>{submitLabel}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
