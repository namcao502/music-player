import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { PlayerService } from './player.service';
import { NotificationService } from './utils/notification.service';
import { TOAST } from '../constants/ui-strings';

@Injectable({ providedIn: 'root' })
export class SleepTimerService implements OnDestroy {
  remainingSeconds = signal(0);
  isActive = computed(() => this.remainingSeconds() > 0);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private player: PlayerService, private notification: NotificationService) {}

  start(minutes: number): void {
    this.cancel();
    this.remainingSeconds.set(minutes * 60);
    this.notification.success(TOAST.SLEEP_TIMER_SET(minutes));
    this.intervalId = setInterval(() => {
      this.remainingSeconds.update((s) => {
        const next = s - 1;
        if (next <= 0) {
          this.stopTimer();
          this.player.pause();
          this.notification.success(TOAST.SLEEP_TIMER_ENDED);
          return 0;
        }
        return next;
      });
    }, 1000);
  }

  cancel(): void {
    const wasActive = this.intervalId !== null;
    this.stopTimer();
    this.remainingSeconds.set(0);
    if (wasActive) {
      this.notification.success(TOAST.SLEEP_TIMER_CANCELLED);
    }
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.cancel();
  }
}
