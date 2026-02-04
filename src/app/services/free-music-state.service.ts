import { Injectable, signal } from '@angular/core';
import type { AudiusTrack } from '../models/audius.models';

/**
 * Holds Free Music search state so it persists when switching to Playlists and back.
 * In-memory only; component reads/writes these signals.
 */
@Injectable({ providedIn: 'root' })
export class FreeMusicStateService {
  readonly query = signal('');
  readonly tracks = signal<AudiusTrack[]>([]);
  readonly page = signal(1);
  readonly hasNextPage = signal(false);
  /** Track IDs whose cover image failed to load. */
  readonly brokenCoverIds = signal<Set<string>>(new Set());
}
