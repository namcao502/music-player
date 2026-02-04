import { Injectable, signal } from '@angular/core';

export interface PromptConfig {
  title: string;
  initialValue: string;
}

export interface ConfirmConfig {
  message: string;
  confirmLabel: string;
}

/**
 * Service to show prompt (add/rename) and confirm (delete) modals for playlist actions.
 * Used by playlist-list and playlist-detail instead of window.prompt/confirm.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistModalService {
  readonly promptConfig = signal<PromptConfig | null>(null);
  readonly confirmConfig = signal<ConfirmConfig | null>(null);

  private promptResolve: ((value: string | null) => void) | null = null;
  private confirmResolve: ((value: boolean) => void) | null = null;

  /** Opens a prompt modal. Returns the entered string or null if cancelled. */
  openPrompt(title: string, initialValue: string = ''): Promise<string | null> {
    this.confirmConfig.set(null);
    this.promptConfig.set({ title, initialValue });
    return new Promise((resolve) => {
      this.promptResolve = resolve;
    });
  }

  /** Closes the prompt modal and resolves with the given value. */
  closePrompt(value: string | null): void {
    this.promptConfig.set(null);
    if (this.promptResolve) {
      this.promptResolve(value);
      this.promptResolve = null;
    }
  }

  /** Opens a confirm modal. Returns true if confirmed, false if cancelled. */
  openConfirm(message: string, confirmLabel: string = 'Delete'): Promise<boolean> {
    this.promptConfig.set(null);
    this.confirmConfig.set({ message, confirmLabel });
    return new Promise((resolve) => {
      this.confirmResolve = resolve;
    });
  }

  /** Closes the confirm modal and resolves with the given value. */
  closeConfirm(value: boolean): void {
    this.confirmConfig.set(null);
    if (this.confirmResolve) {
      this.confirmResolve(value);
      this.confirmResolve = null;
    }
  }
}
