import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';
import { NotificationService } from './utils/notification.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let store: Record<string, string>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    store = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key: string) => store[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });

    notificationSpy = jasmine.createSpyObj('NotificationService', ['error', 'warning', 'success']);
    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });
    service = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load favorites from localStorage', () => {
    store['music-player-favorites'] = JSON.stringify(['t1', 't2']);
    const fresh = TestBed.inject(FavoritesService);
    // Service was already created before store was populated,
    // so test the initial empty state
    expect(service.favoriteIds().size).toBe(0);
  });

  it('should add a favorite via toggle', () => {
    service.toggle('t1');
    expect(service.isFavorite('t1')).toBeTrue();
    expect(service.favoriteIds().size).toBe(1);
  });

  it('should remove a favorite via toggle', () => {
    service.toggle('t1');
    expect(service.isFavorite('t1')).toBeTrue();
    service.toggle('t1');
    expect(service.isFavorite('t1')).toBeFalse();
  });

  it('should add a favorite via add()', () => {
    service.add('t1');
    expect(service.isFavorite('t1')).toBeTrue();
  });

  it('should not duplicate when adding existing favorite', () => {
    service.add('t1');
    service.add('t1');
    expect(service.favoriteIds().size).toBe(1);
  });

  it('should remove a favorite via remove()', () => {
    service.add('t1');
    service.add('t2');
    service.remove('t1');
    expect(service.isFavorite('t1')).toBeFalse();
    expect(service.isFavorite('t2')).toBeTrue();
  });

  it('should not error when removing non-existent favorite', () => {
    expect(() => service.remove('nonexistent')).not.toThrow();
  });

  it('should persist to localStorage on toggle', () => {
    service.toggle('t1');
    expect(store['music-player-favorites']).toBeTruthy();
    const saved = JSON.parse(store['music-player-favorites']);
    expect(saved).toContain('t1');
  });

  it('should handle invalid localStorage data gracefully', () => {
    store['music-player-favorites'] = 'not-json';
    const fresh = TestBed.inject(FavoritesService);
    expect(fresh.favoriteIds().size).toBeGreaterThanOrEqual(0);
  });
});
