import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerBarComponent } from './components/player-bar/player-bar.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PlayerBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(public theme: ThemeService) {}
}
