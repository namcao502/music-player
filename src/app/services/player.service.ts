import { Injectable, signal } from '@angular/core';

/** Track that can be played (e.g. from Audius free music). */
export interface PlayableTrack {
  id: string;
  title: string;
  artist?: string;
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

/** Called synchronously from play() so that audio.play() runs in the same user gesture (avoids autoplay block). */
export type PlaybackTrigger = (streamUrl: string, trackId: string) => void;

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private current = signal<NowPlaying | null>(null);
  private queue = signal<PlayableTrack[]>([]);
  private history = signal<PlayableTrack[]>([]);
  private playing = signal(false);
  private playbackTrigger: PlaybackTrigger | null = null;

  nowPlaying = this.current.asReadonly();
  queueList = this.queue.asReadonly();
  isPlaying = this.playing.asReadonly();

  constructor() {}

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

  next(): void {
    const list = this.queue();
    const now = this.current();
    if (!now || list.length === 0) return;
    const idx = list.findIndex((s) => s.id === now.track.id);
    const nextIdx = idx < 0 ? 0 : idx + 1;
    if (nextIdx < list.length) {
      this.history.update((h) => [...h, now.track]);
      this.play(list[nextIdx]);
    }
  }

  previous(): void {
    const now = this.current();
    const hist = this.history();
    if (hist.length > 0 && now) {
      const prevSong = hist[hist.length - 1];
      this.history.update((h) => h.slice(0, -1));
      this.play(prevSong);
    }
  }

  clearQueue(): void {
    this.queue.set([]);
    this.history.set([]);
  }
}
