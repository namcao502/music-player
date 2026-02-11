import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlaylistModalService } from '../../services/playlist-modal.service';

@Component({
  selector: 'app-playlist-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './playlist-modal.component.html',
  styleUrl: './playlist-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaylistModalComponent {
  /** Local value for the prompt input; synced when prompt opens. */
  promptValue = signal('');

  constructor(public modal: PlaylistModalService) {
    effect(
      () => {
        const config = this.modal.promptConfig();
        this.promptValue.set(config?.initialValue ?? '');
      },
      { allowSignalWrites: true }
    );
  }

  onPromptSubmit(): void {
    this.modal.closePrompt(this.promptValue().trim());
  }

  onPromptCancel(): void {
    this.modal.closePrompt(null);
  }

  onConfirmYes(): void {
    this.modal.closeConfirm(true);
  }

  onConfirmNo(): void {
    this.modal.closeConfirm(false);
  }

  onBackdropClick(e: Event): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.modal.promptConfig() && this.modal.closePrompt(null);
      this.modal.confirmConfig() && this.modal.closeConfirm(false);
    }
  }
}
