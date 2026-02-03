import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'music-player-theme';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageStub: Record<string, string>;

  beforeEach(() => {
    localStorageStub = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => localStorageStub[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      localStorageStub[key] = value;
    });
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('T1: initial theme from localStorage', () => {
    localStorageStub[STORAGE_KEY] = 'light';
    const s = new ThemeService();
    expect(s.current()).toBe('light');
  });

  it('T2: initial theme when no stored theme uses prefers-color-scheme or dark', () => {
    delete localStorageStub[STORAGE_KEY];
    (Storage.prototype.getItem as jasmine.Spy).and.returnValue(null);
    const matchMediaStub = jasmine.createSpy('matchMedia').and.returnValue({ matches: true });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaStub, configurable: true });
    const s = new ThemeService();
    expect(s.current()).toBe('light');
  });

  it('T3: setTheme updates signal and persists', () => {
    service.setTheme('light');
    expect(service.current()).toBe('light');
    expect(localStorageStub[STORAGE_KEY]).toBe('light');
  });

  it('T4: toggle switches dark to light and light to dark', () => {
    service.setTheme('dark');
    service.toggle();
    expect(service.current()).toBe('light');
    service.toggle();
    expect(service.current()).toBe('dark');
  });

  it('T5: isDark and isLight computed', () => {
    service.setTheme('dark');
    expect(service.isDark()).toBe(true);
    expect(service.isLight()).toBe(false);
    service.setTheme('light');
    expect(service.isDark()).toBe(false);
    expect(service.isLight()).toBe(true);
  });
});
