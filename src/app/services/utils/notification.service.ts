import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'success';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private idCounter = 0;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration);
  }

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  private show(message: string, type: 'error' | 'warning' | 'success', duration: number): void {
    const id = String(this.idCounter++);
    const notification: Notification = { id, message, type, duration };

    this.notifications.update((list) => [...list, notification]);

    if (duration > 0) {
      const timerId = setTimeout(() => {
        this.timers.delete(id);
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timerId);
    }
  }

  dismiss(id: string): void {
    const timerId = this.timers.get(id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this.timers.delete(id);
    }
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
