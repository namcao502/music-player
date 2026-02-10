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
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  dismiss(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
