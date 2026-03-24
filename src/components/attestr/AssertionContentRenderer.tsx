import type { NostrEvent } from '@nostrify/nostrify';

import { NoteContent } from '@/components/NoteContent';
import { encodeEventIdAsNevent, encodeNpub } from '@/lib/nostrEncodings';

interface AssertionContentRendererProps {
  event: NostrEvent;
  mode?: 'summary' | 'full';
}

export function AssertionContentRenderer({ event, mode = 'full' }: AssertionContentRendererProps) {
  if (event.kind === 0) {
    return <Kind0MetadataView event={event} mode={mode} />;
  }

  if (event.kind === 3) {
    return <Kind3ContactsView event={event} mode={mode} />;
  }

  if (event.kind === 30023) {
    return <Kind30023View event={event} mode={mode} />;
  }

  if (mode === 'summary') {
    const summary = event.content.trim();

    return (
      <p className="text-sm text-muted-foreground break-words line-clamp-2">
        {summary || 'No content'}
      </p>
    );
  }

  return <NoteContent event={event} className="text-sm" />;
}

function Kind0MetadataView({ event, mode }: { event: NostrEvent; mode: 'summary' | 'full' }) {
  const metadata = parseJson(event.content);

  if (!metadata) {
    if (mode === 'summary') {
      return <p className="text-sm text-muted-foreground break-words line-clamp-2">Invalid metadata JSON</p>;
    }

    return <p className="text-sm text-muted-foreground break-words">Invalid metadata JSON</p>;
  }

  const rows = [
    { label: 'Name', value: stringField(metadata.name) },
    { label: 'Display name', value: stringField(metadata.display_name) },
    { label: 'About', value: stringField(metadata.about) },
    { label: 'NIP-05', value: stringField(metadata.nip05) },
    { label: 'Website', value: stringField(metadata.website) },
    { label: 'Lightning', value: stringField(metadata.lud16) ?? stringField(metadata.lud06) },
  ].filter((row) => row.value);

  const compactRows = rows.slice(0, mode === 'summary' ? 2 : rows.length);

  if (compactRows.length === 0) {
    return <p className="text-sm text-muted-foreground break-words">No profile fields set.</p>;
  }

  return (
    <div className="space-y-1 text-sm">
      {compactRows.map((row) => (
        <p key={row.label} className={mode === 'summary' ? 'line-clamp-1' : 'break-words'}>
          <span className="text-muted-foreground">{row.label}: </span>
          <span>{row.value}</span>
        </p>
      ))}
    </div>
  );
}

function Kind3ContactsView({ event, mode }: { event: NostrEvent; mode: 'summary' | 'full' }) {
  const contactPubkeys = event.tags
    .filter(([name, value]) => name === 'p' && typeof value === 'string' && value.length > 0)
    .map(([, value]) => value);

  if (contactPubkeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No contacts listed.</p>;
  }

  const shown = mode === 'summary' ? contactPubkeys.slice(0, 3) : contactPubkeys;

  return (
    <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">{contactPubkeys.length} contacts</p>
      {shown.map((pubkey, index) => (
        <p key={`${pubkey}-${index}`} className="font-mono text-xs break-all text-muted-foreground">
          {encodeNpub(pubkey)}
        </p>
      ))}
      {mode === 'summary' && contactPubkeys.length > shown.length ? (
        <p className="text-xs text-muted-foreground">+{contactPubkeys.length - shown.length} more</p>
      ) : null}
    </div>
  );
}

function Kind30023View({ event, mode }: { event: NostrEvent; mode: 'summary' | 'full' }) {
  const title = event.tags.find(([name]) => name === 'title')?.[1];
  const summary = event.tags.find(([name]) => name === 'summary')?.[1] ?? event.content.trim();

  if (mode === 'summary') {
    return (
      <div className="space-y-1 text-sm">
        {title ? <p className="font-medium line-clamp-1">{title}</p> : null}
        <p className="text-muted-foreground break-words line-clamp-2">{summary || 'No content'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {title ? <p className="font-medium">{title}</p> : null}
      <p className="text-muted-foreground break-words whitespace-pre-wrap">{summary || 'No content'}</p>
      {title ? (
        <p className="text-xs text-muted-foreground">Content event: {encodeEventIdAsNevent(event.id)}</p>
      ) : null}
    </div>
  );
}

function parseJson(input: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
