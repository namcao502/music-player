import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotificationService } from '../../services/utils/notification.service';
import { BTN } from '../../constants/ui-strings';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationToastComponent {
  readonly strings = { BTN };

  constructor(public notificationService: NotificationService) {}
}
