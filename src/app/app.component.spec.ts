import { provideHttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { PlayerService, type PlayableTrack } from './services/player.service';

const mockTrack: PlayableTrack = {
  id: '1',
  title: 'T',
  duration: 0,
  streamUrl: 'https://stream/1'
};

describe('AppComponent', () => {
  let themeSpy: jasmine.SpyObj<ThemeService>;
  let player: PlayerService;

  beforeEach(async () => {
    themeSpy = jasmine.createSpyObj('ThemeService', ['toggle', 'isDark']);
    themeSpy.isDark.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ThemeService, useValue: themeSpy },
        provideRouter([]),
        provideHttpClient()
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    player = TestBed.inject(PlayerService);
  });

  function dispatchKey(key: string): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('R1: renders theme toggle in top right', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.theme-toggle-top')).toBeTruthy();
  });

  it('R2: theme toggle calls theme.toggle()', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.theme-toggle-top') as HTMLButtonElement;
    btn.click();
    expect(themeSpy.toggle).toHaveBeenCalled();
  });

  it('R3: router outlet present', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('R4: keyboard Space toggles play/pause when nowPlaying is set', () => {
    player.playQueue([mockTrack], 0);
    spyOn(player, 'togglePlayPause');
    TestBed.createComponent(AppComponent).detectChanges();
    dispatchKey(' ');
    expect(player.togglePlayPause).toHaveBeenCalled();
  });

  it('R5: keyboard ArrowRight calls next when nowPlaying is set', () => {
    player.playQueue([mockTrack, { ...mockTrack, id: '2', streamUrl: 'https://stream/2' }], 0);
    spyOn(player, 'next');
    TestBed.createComponent(AppComponent).detectChanges();
    dispatchKey('ArrowRight');
    expect(player.next).toHaveBeenCalled();
  });

  it('R6: keyboard ArrowLeft calls previous when nowPlaying is set', () => {
    player.playQueue([mockTrack, { ...mockTrack, id: '2', streamUrl: 'https://stream/2' }], 1);
    spyOn(player, 'previous');
    TestBed.createComponent(AppComponent).detectChanges();
    dispatchKey('ArrowLeft');
    expect(player.previous).toHaveBeenCalled();
  });

  it('R6b: keyboard ArrowRight still works when a range input is focused', () => {
    player.playQueue([mockTrack, { ...mockTrack, id: '2', streamUrl: 'https://stream/2' }], 0);
    spyOn(player, 'next');
    TestBed.createComponent(AppComponent).detectChanges();
    const slider = document.createElement('input');
    slider.setAttribute('type', 'range');
    document.body.appendChild(slider);
    slider.focus();
    dispatchKey('ArrowRight');
    expect(player.next).toHaveBeenCalled();
    slider.remove();
  });

  it('R7: keyboard ignored when nothing playing', () => {
    spyOn(player, 'togglePlayPause');
    TestBed.createComponent(AppComponent).detectChanges();
    dispatchKey(' ');
    expect(player.togglePlayPause).not.toHaveBeenCalled();
  });
});
