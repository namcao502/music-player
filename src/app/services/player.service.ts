import { Injectable, signal } from '@angular/core';

/** Track that can be played (e.g. from Audius free music). */
export interface PlayableTrack {
  id: string;
  title: string;
  artist?: string;
  /** Audius user ID of the artist. */
  artistId?: string;
  album?: string;
  duration: number;
  /** Full image URL (e.g. from Audius). */
  coverArtUrl?: string;
  /** Stream URL for playback; required for play(). */
  streamUrl?: string;
}

export interface NowPlaying {
  track: PlayableTrack;
  streamUrl: string;
}

export type LoopMode = 'off' | 'all' | 'one';

/** Called synchronously from play() so that audio.play() runs in the same user gesture (avoids autoplay block). */
export type PlaybackTrigger = (streamUrl: string, trackId: string) => void;

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private current = signal<NowPlaying | null>(null);
  private queue = signal<PlayableTrack[]>([]);
  private playing = signal(false);
  private shuffle = signal(false);
  private loop = signal<LoopMode>('off');
  private crossfade = signal(0);
  private playbackTrigger: PlaybackTrigger | null = null;

  nowPlaying = this.current.asReadonly();
  queueList = this.queue.asReadonly();
  isPlaying = this.playing.asReadonly();
  shuffleEnabled = this.shuffle.asReadonly();
  loopMode = this.loop.asReadonly();
  /** Crossfade duration in seconds (0 = off). */
  crossfadeDuration = this.crossfade.asReadonly();

  constructor() {
    this.loadCrossfade();
  }

  private loadCrossfade(): void {
    try {
      const val = localStorage.getItem('crossfade-duration');
      if (val) this.crossfade.set(Number(val) || 0);
    } catch { /* ignore */ }
  }

  setCrossfadeDuration(seconds: number): void {
    const clamped = Math.max(0, Math.min(12, Math.round(seconds)));
    this.crossfade.set(clamped);
    try { localStorage.setItem('crossfade-duration', String(clamped)); } catch { /* ignore */ }
  }

  /** Register a function to start playback (set src, load, play) in the same tick as play(). */
  registerPlaybackTrigger(fn: PlaybackTrigger): void {
    this.playbackTrigger = fn;
  }

  /** Play a track. streamUrl or track.streamUrl is required. */
  play(track: PlayableTrack, streamUrl?: string): void {
    const url = streamUrl ?? track.streamUrl;
    if (!url) return;
    this.current.set({ track, streamUrl: url });
    this.playing.set(true);
    this.playbackTrigger?.(url, track.id);
  }

  playQueue(songs: PlayableTrack[], startIndex = 0): void {
    if (songs.length === 0) return;
    this.queue.set(songs);
    this.play(songs[startIndex]);
  }

  togglePlayPause(): void {
    this.playing.update((p) => !p);
  }

  toggleShuffle(): void {
    this.shuffle.update((v) => !v);
  }

  cycleLoopMode(): void {
    this.loop.update((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }

  /** Sync play state from audio element (e.g. user paused in browser). */
  setPlaying(value: boolean): void {
    this.playing.set(value);
  }

  pause(): void {
    this.playing.set(false);
  }

  stop(): void {
    this.playing.set(false);
    this.current.set(null);
  }

  /** Called by the player bar when the audio element fires "ended". */
  handleEnded(): void {
    const mode = this.loop();
    if (mode === 'one') {
      const now = this.current();
      if (now) this.play(now.track, now.streamUrl);
      return;
    }
    this.next();
  }

  next(): void {
    const list = this.queue();
    const now = this.current();
    if (!now || list.length === 0) return;
    const idx = list.findIndex((s) => s.id === now.track.id);
    const mode = this.loop();
    if (this.shuffle()) {
      const nextTrack = this.pickRandomDifferent(list, now.track.id);
      this.play(nextTrack);
      return;
    }
    const nextIdx = idx < 0 ? 0 : idx + 1;
    if (nextIdx < list.length) {
      this.play(list[nextIdx]);
      return;
    }
    if (mode === 'all') {
      this.play(list[0]);
      return;
    }
    // loop=off: stop at end of queue (keep current track visible)
    this.playing.set(false);
  }

  previous(): void {
    const list = this.queue();
    const now = this.current();
    if (!now || list.length === 0) return;
    if (this.shuffle()) {
      const prevTrack = this.pickRandomDifferent(list, now.track.id);
      this.play(prevTrack);
      return;
    }
    const idx = list.findIndex((s) => s.id === now.track.id);
    const prevIdx = idx <= 0 ? list.length - 1 : idx - 1;
    this.play(list[prevIdx]);
  }

  /** Append a track to the end of the queue. If nothing is playing, start playback. Returns true if playback started. */
  addToQueue(track: PlayableTrack): boolean {
    if (this.queue().length === 0 && !this.current()) {
      this.playQueue([track], 0);
      return true;
    }
    this.queue.update((q) => [...q, track]);
    return false;
  }

  clearQueue(): void {
    this.queue.set([]);
  }

  /** Remove track at index from queue. If it's the current track, advance to next or stop. */
  removeFromQueue(index: number): void {
    const list = [...this.queue()];
    if (index < 0 || index >= list.length) return;
    const now = this.current();
    const isCurrent = now && list[index].id === now.track.id;
    list.splice(index, 1);
    this.queue.set(list);
    if (isCurrent && list.length > 0) {
      const nextIdx = Math.min(index, list.length - 1);
      this.play(list[nextIdx]);
    } else if (isCurrent) {
      this.stop();
    }
  }

  private pickRandomDifferent(list: PlayableTrack[], currentId: string): PlayableTrack {
    if (list.length <= 1) return list[0];
    let candidate = list[0];
    // Try a few times to avoid picking the same track; fallback to first different.
    for (let i = 0; i < 8; i++) {
      candidate = list[Math.floor(Math.random() * list.length)];
      if (candidate.id !== currentId) return candidate;
    }
    return list.find((t) => t.id !== currentId) ?? list[0];
  }
}
