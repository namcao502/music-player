import {
  Component,
  ElementRef,
  effect,
  computed,
  HostListener,
  viewChild,
  signal,
  OnDestroy,
  afterNextRender
} from '@angular/core';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player.service';
import { PlaylistModalService } from '../../services/playlist-modal.service';
import { PlaylistService } from '../../services/playlist.service';

@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [],
  templateUrl: './player-bar.component.html',
  styleUrl: './player-bar.component.scss'
})
export class PlayerBarComponent implements OnDestroy {
  private audioRef = viewChild<ElementRef<HTMLAudioElement>>('audioEl');
  private attachedEl: HTMLAudioElement | null = null;
  /** Track id we last set on the audio element (stream URL may not contain id, e.g. Audius). */
  loadedTrackId: string | null = null;
  /** Ignore play/pause/error/ended from the element after we changed src (avoids toggle loop). */
  private suppressAudioEventsUntil = 0;
  /** Track id that the playback trigger just set; effect skips load() to avoid double load. */
  private trackJustSetByTrigger: string | null = null;
  /** Cleanup for the one-time "retry play on next user gesture" listener. */
  private retryPlayCleanup: (() => void) | null = null;
  /** Active crossfade interval id (null when not crossfading). */
  private crossfadeInterval: ReturnType<typeof setInterval> | null = null;
  /** True while a crossfade is in progress (prevents re-triggering). */
  private crossfading = false;

  currentTime = signal(0);
  duration = signal(0);
  isSeeking = signal(false);
  /** Cover image failed to load; show music symbol instead. */
  coverError = signal(false);
  /** Whether the queue list panel is visible. */
  showQueue = signal(false);
  /** Track IDs in queue whose cover image failed to load. */
  queueCoverErrors = signal<Set<string>>(new Set());
  /** Track id for which queue "Add to playlist" dropdown is open. */
  queueAddToPlaylistTrackId = signal<string | null>(null);
  /** Volume level 0–1. */
  volume = signal(1);
  /** Total queue duration in seconds. */
  totalQueueDuration = computed(() => {
    return this.player.queueList().reduce((sum, t) => sum + (t.duration || 0), 0);
  });
  private timeupdateBound = (): void => this.onTimeUpdate();
  private playBound = (): void => {
    if (Date.now() < this.suppressAudioEventsUntil) return;
    this.player.setPlaying(true);
  };
  private pauseBound = (): void => {
    if (Date.now() < this.suppressAudioEventsUntil) return;
    this.player.setPlaying(false);
  };
  private endedBound = (e: Event): void => {
    if (Date.now() < this.suppressAudioEventsUntil) return;
    const el = e.currentTarget as HTMLAudioElement;
    const duration = el?.duration;
    const currentTime = el?.currentTime ?? 0;
    // Only advance when track actually played to the end (avoids loop when src change fires ended)
    if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) return;
    if (currentTime < duration - 2) return;
    this.player.handleEnded();
  };
  private durationChangeBound = (): void => this.onDurationChange();
  private errorBound = (): void => {
    if (Date.now() < this.suppressAudioEventsUntil) return;
    this.player.setPlaying(false);
  };

  constructor(
    public player: PlayerService,
    public playlistService: PlaylistService,
    private playlistModal: PlaylistModalService,
    private router: Router
  ) {
    afterNextRender(() => {
      const el = this.audioRef()?.nativeElement;
      if (el) {
        this.player.registerPlaybackTrigger((url: string, trackId: string) => {
          this.clearCrossfade();
          this.loadedTrackId = trackId;
          this.trackJustSetByTrigger = trackId;
          this.suppressAudioEventsUntil = Date.now() + 1500;
          el.src = url;
          el.load();
          this.currentTime.set(0);
          const np = this.player.nowPlaying();
          if (np) this.duration.set(np.track.duration);
          this.attachAudioListenersOnce(el);
          this.startPlayWhenReady(el);
          // After suppression window, sync play state and seekbar from the element so UI matches reality
          setTimeout(() => this.syncFromElement(), 1600);
        });
      }
    });

    effect(() => {
      const np = this.player.nowPlaying();
      const playing = this.player.isPlaying();
      const ref = this.audioRef();
      const el = ref?.nativeElement;
      if (!np || !el) {
        this.loadedTrackId = null;
        this.coverError.set(false);
        return;
      }
      const isNewTrack = this.loadedTrackId !== np.track.id;
      const triggerJustSetThisTrack = this.trackJustSetByTrigger === np.track.id;
      if (triggerJustSetThisTrack) this.trackJustSetByTrigger = null;
      if (isNewTrack) {
        this.loadedTrackId = np.track.id;
        this.coverError.set(false);
        this.currentTime.set(0);
        this.duration.set(np.track.duration);
        if (!triggerJustSetThisTrack) {
          this.suppressAudioEventsUntil = Date.now() + 1500;
          el.src = np.streamUrl;
          el.load();
          if (playing) this.startPlayWhenReady(el);
        }
      }
      this.attachAudioListenersOnce(el);
      // Always drive element from service state so play/pause button and seekbar stay in sync
      if (playing) {
        el.play().catch(() => this.onPlayFailed());
      } else {
        el.pause();
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.retryPlayCleanup?.();
    this.retryPlayCleanup = null;
    this.clearCrossfade();
    if (this.attachedEl) this.detachAudioListeners(this.attachedEl);
    this.attachedEl = null;
  }

  private attachAudioListenersOnce(el: HTMLAudioElement): void {
    if (this.attachedEl === el) return;
    if (this.attachedEl) this.detachAudioListeners(this.attachedEl);
    this.attachedEl = el;
    el.addEventListener('timeupdate', this.timeupdateBound);
    el.addEventListener('play', this.playBound);
    el.addEventListener('pause', this.pauseBound);
    el.addEventListener('ended', this.endedBound);
    el.addEventListener('durationchange', this.durationChangeBound);
    el.addEventListener('error', this.errorBound);
  }

  private detachAudioListeners(el: HTMLAudioElement): void {
    el.removeEventListener('timeupdate', this.timeupdateBound);
    el.removeEventListener('play', this.playBound);
    el.removeEventListener('pause', this.pauseBound);
    el.removeEventListener('ended', this.endedBound);
    el.removeEventListener('durationchange', this.durationChangeBound);
    el.removeEventListener('error', this.errorBound);
  }

  private onAudioError(): void {
    this.player.setPlaying(false);
  }

  private onTimeUpdate(): void {
    if (this.isSeeking()) return;
    const el = this.audioRef()?.nativeElement;
    if (!el || isNaN(el.currentTime)) return;
    this.currentTime.set(Math.floor(el.currentTime));
    this.checkCrossfade(el);
  }

  /** If crossfade is enabled and track is near its end, start fading out. */
  private checkCrossfade(el: HTMLAudioElement): void {
    const cf = this.player.crossfadeDuration();
    if (cf <= 0 || this.crossfading) return;
    const d = el.duration;
    if (!isFinite(d) || d <= 0) return;
    const remaining = d - el.currentTime;
    if (remaining > cf || remaining <= 0) return;
    // Start crossfade: gradually reduce volume then advance
    this.crossfading = true;
    const userVol = this.volume();
    const steps = Math.max(1, cf * 10); // 10 updates per second
    const stepMs = (cf * 1000) / steps;
    let step = 0;
    this.crossfadeInterval = setInterval(() => {
      step++;
      const ratio = 1 - step / steps;
      el.volume = Math.max(0, userVol * ratio);
      if (step >= steps) {
        this.clearCrossfade();
        el.volume = userVol;
        this.player.handleEnded();
      }
    }, stepMs);
  }

  private clearCrossfade(): void {
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = null;
    }
    this.crossfading = false;
  }

  /** Start playback now and again when the element is ready (helps streams that need to buffer). */
  private startPlayWhenReady(el: HTMLAudioElement): void {
    const trackId = this.player.nowPlaying()?.track.id;
    el.play().catch(() => this.onPlayFailed());
    const onCanPlay = (): void => {
      el.removeEventListener('canplay', onCanPlay);
      if (this.player.isPlaying() && this.loadedTrackId === trackId) {
        el.play().catch(() => this.onPlayFailed());
      }
    };
    el.addEventListener('canplay', onCanPlay);
  }

  /** When play() is blocked (e.g. autoplay policy), retry on next user click or keypress. */
  private onPlayFailed(): void {
    this.player.setPlaying(false);
    this.retryPlayOnNextUserGesture();
  }

  /** Register a one-time listener to try play() on the next user gesture (any click or keydown). */
  private retryPlayOnNextUserGesture(): void {
    this.retryPlayCleanup?.();
    this.retryPlayCleanup = null;
    const handler = (): void => {
      this.retryPlayCleanup?.();
      this.retryPlayCleanup = null;
      const el = this.audioRef()?.nativeElement;
      if (!el || !this.player.nowPlaying()) return;
      el.play()
        .then(() => this.player.setPlaying(true))
        .catch(() => {});
    };
    const opts = { once: true, capture: true };
    document.addEventListener('click', handler, opts);
    document.addEventListener('keydown', handler, opts);
    this.retryPlayCleanup = () => {
      document.removeEventListener('click', handler, opts);
      document.removeEventListener('keydown', handler, opts);
    };
  }

  /** Sync play state and seekbar from the audio element so UI matches actual playback. */
  private syncFromElement(): void {
    const el = this.audioRef()?.nativeElement;
    if (!el || !this.player.nowPlaying()) return;
    this.player.setPlaying(!el.paused);
    if (!isNaN(el.currentTime)) this.currentTime.set(Math.floor(el.currentTime));
    const d = el.duration;
    if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0)
      this.duration.set(Math.floor(d));
  }

  private onDurationChange(): void {
    const el = this.audioRef()?.nativeElement;
    const d = el?.duration;
    if (el && typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0)
      this.duration.set(Math.floor(d));
  }

  onSeekInput(value: number): void {
    this.isSeeking.set(true);
    this.currentTime.set(value);
  }

  onSeekChange(value: number): void {
    const el = this.audioRef()?.nativeElement;
    if (el) el.currentTime = value;
    this.isSeeking.set(false);
  }

  toggleQueue(): void {
    this.showQueue.update((v) => !v);
  }

  playFromQueue(index: number): void {
    const list = this.player.queueList();
    const track = list[index];
    if (!track?.streamUrl) return;
    if (this.isCurrentTrack(track.id)) {
      this.player.togglePlayPause();
    } else {
      this.player.play(track);
    }
  }

  onQueueCoverError(trackId: string): void {
    this.queueCoverErrors.update((s) => new Set(s).add(trackId));
  }

  isCurrentTrack(trackId: string): boolean {
    const np = this.player.nowPlaying();
    return np?.track.id === trackId;
  }

  coverUrl(np: { coverArtUrl?: string }): string {
    return np.coverArtUrl ?? '';
  }

  formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  openQueueAddToPlaylist(trackId: string, e: Event): void {
    e.stopPropagation();
    this.queueAddToPlaylistTrackId.set(
      this.queueAddToPlaylistTrackId() === trackId ? null : trackId
    );
  }

  addQueueTrackToPlaylist(playlistId: string, trackId: string): void {
    this.playlistService.addTrack(playlistId, trackId);
    this.queueAddToPlaylistTrackId.set(null);
  }

  async createPlaylistAndAddQueueTrack(trackId: string): Promise<void> {
    const name = await this.playlistModal.openPrompt('New playlist name', 'New playlist');
    if (name == null) return;
    const id = this.playlistService.create(name.trim() || 'New playlist');
    this.playlistService.addTrack(id, trackId);
    this.queueAddToPlaylistTrackId.set(null);
    this.router.navigate(['/playlists', id]);
  }

  closeQueueAddToPlaylist(): void {
    this.queueAddToPlaylistTrackId.set(null);
  }

  onClearQueue(): void {
    const el = this.audioRef()?.nativeElement;
    if (el) el.pause();
    this.clearCrossfade();
    this.player.clearQueue();
    this.player.stop();
  }

  onVolumeInput(value: number): void {
    this.volume.set(value);
    const el = this.audioRef()?.nativeElement;
    if (el) el.volume = value;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeQueueAddToPlaylist();
  }
}
