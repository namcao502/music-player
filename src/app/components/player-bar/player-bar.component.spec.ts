import { TestBed } from '@angular/core/testing';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService } from '../../services/player.service';

describe('PlayerBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerBarComponent],
      providers: [PlayerService]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('B1: formatDuration(seconds) returns M:SS', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.formatDuration(65)).toBe('1:05');
    expect(fixture.componentInstance.formatDuration(0)).toBe('0:00');
  });

  it('B2: formatDuration invalid returns 0:00', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.formatDuration(NaN)).toBe('0:00');
    expect(fixture.componentInstance.formatDuration(-1)).toBe('0:00');
  });

  it('B3: coverUrl with coverArtUrl returns it', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    const url = fixture.componentInstance.coverUrl({ coverArtUrl: 'https://art/url' });
    expect(url).toBe('https://art/url');
  });

  it('B4: coverUrl with no coverArtUrl returns empty string', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.coverUrl({})).toBe('');
  });

  it('B5: uses PlayerService', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    expect(fixture.componentInstance.player).toBeTruthy();
  });
});
