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

  if (event.kind === 37515) {
    return <Kind37515PlacesView event={event} mode={mode} />;
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

function Kind37515PlacesView({ event, mode }: { event: NostrEvent; mode: 'summary' | 'full' }) {
  const point = parsePlacePoint(event.content);
  const placeName = getTagValue(event, 'name') ?? getTagValue(event, 'title');
  const placeSummary = getTagValue(event, 'summary') ?? getTagValue(event, 'description');
  const placeAddress = getTagValue(event, 'address');
  const placeGeohash = getTagValue(event, 'g');

  if (!point) {
    return mode === 'summary'
      ? <p className="text-sm text-muted-foreground break-words line-clamp-2">Invalid place GeoJSON content</p>
      : <p className="text-sm text-muted-foreground break-words">Invalid place GeoJSON content</p>;
  }

  const { latitude, longitude } = point;
  const bbox = buildOsmBbox(longitude, latitude, 0.01);
  const embeddedMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;

  if (mode === 'summary') {
    return (
      <div className="space-y-1 text-sm">
        {placeName ? <p className="font-medium line-clamp-1">{placeName}</p> : null}
        {placeSummary ? (
          <p className="text-muted-foreground break-words line-clamp-2">{placeSummary}</p>
        ) : null}
        <p className="text-muted-foreground break-words line-clamp-1">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <iframe
          title={`Place map at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
          src={embeddedMapUrl}
          className="h-24 w-full rounded-md border border-slate-200"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {placeName ? <p className="font-medium break-words">{placeName}</p> : null}
      {placeSummary ? (
        <p className="text-muted-foreground break-words whitespace-pre-wrap">{placeSummary}</p>
      ) : null}
      {placeAddress ? (
        <p className="text-muted-foreground break-words">Address: {placeAddress}</p>
      ) : null}
      {placeGeohash ? (
        <p className="font-mono text-xs text-muted-foreground break-all">Geohash: {placeGeohash}</p>
      ) : null}
      <p className="text-muted-foreground break-words">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
      <a
        href={openStreetMapUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="block"
      >
        <iframe
          title={`Place map at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
          src={embeddedMapUrl}
          className="h-56 w-full rounded-md border border-slate-200"
          loading="lazy"
        />
      </a>
      <p className="text-xs text-muted-foreground">Map data © OpenStreetMap contributors</p>
    </div>
  );
}

function buildOsmBbox(longitude: number, latitude: number, delta: number): string {
  const minLon = clamp(longitude - delta, -180, 180);
  const minLat = clamp(latitude - delta, -90, 90);
  const maxLon = clamp(longitude + delta, -180, 180);
  const maxLat = clamp(latitude + delta, -90, 90);

  return `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  const value = event.tags.find(([name]) => name === tagName)?.[1];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function parsePlacePoint(input: string): { latitude: number; longitude: number } | null {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const featureCollection = parsed as {
      type?: unknown;
      features?: unknown;
    };

    if (featureCollection.type !== 'FeatureCollection' || !Array.isArray(featureCollection.features)) {
      return null;
    }

    const pointFeature = featureCollection.features.find((feature): feature is {
      type?: unknown;
      geometry?: { type?: unknown; coordinates?: unknown };
    } => {
      if (!feature || typeof feature !== 'object') return false;
      const candidate = feature as { type?: unknown; geometry?: { type?: unknown; coordinates?: unknown } };
      return candidate.type === 'Feature' && candidate.geometry?.type === 'Point' && Array.isArray(candidate.geometry.coordinates);
    });

    if (!pointFeature) return null;

    const geometry = pointFeature.geometry;
    if (!geometry || !Array.isArray(geometry.coordinates)) return null;
    const coordinates = geometry.coordinates as unknown[];
    if (coordinates.length < 2) return null;

    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
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
