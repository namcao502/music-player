import {
  Component,
  ElementRef,
  effect,
  viewChild,
  signal,
  OnDestroy,
  afterNextRender
} from '@angular/core';
import { PlayerService } from '../../services/player.service';

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

  currentTime = signal(0);
  duration = signal(0);
  isSeeking = signal(false);
  /** Cover image failed to load; show music symbol instead. */
  coverError = signal(false);
  /** Whether the queue list panel is visible. */
  showQueue = signal(false);
  /** Track IDs in queue whose cover image failed to load. */
  queueCoverErrors = signal<Set<string>>(new Set());
  private timeupdateBound = (): void => this.onTimeUpdate();
  private playBound = (): void => this.player.setPlaying(true);
  private pauseBound = (): void => this.player.setPlaying(false);
  private endedBound = (): void => this.player.next();
  private durationChangeBound = (): void => this.onDurationChange();
  private errorBound = (): void => this.onAudioError();

  constructor(public player: PlayerService) {
    afterNextRender(() => {
      const el = this.audioRef()?.nativeElement;
      if (el) {
        this.player.registerPlaybackTrigger((url: string, trackId: string) => {
          this.loadedTrackId = trackId;
          el.src = url;
          el.load();
          this.currentTime.set(0);
          const np = this.player.nowPlaying();
          if (np) this.duration.set(np.track.duration);
          this.attachAudioListenersOnce(el);
          el.play().catch((err: unknown) => {
            this.player.setPlaying(false);
            console.warn('Playback failed. Click the play button.', err);
          });
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
      if (isNewTrack) {
        this.loadedTrackId = np.track.id;
        this.coverError.set(false);
        el.src = np.streamUrl;
        el.load();
        this.currentTime.set(0);
        this.duration.set(np.track.duration);
      }
      this.attachAudioListenersOnce(el);
      if (playing) {
        el.play().catch((err: unknown) => {
          this.player.setPlaying(false);
          console.warn('Playback failed (e.g. autoplay blocked). Click the play button.', err);
        });
      } else {
        el.pause();
      }
    });
  }

  ngOnDestroy(): void {
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
    if (el && !isNaN(el.currentTime)) this.currentTime.set(Math.floor(el.currentTime));
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
}
