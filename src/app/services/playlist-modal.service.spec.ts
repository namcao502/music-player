import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlaylistModalService } from './playlist-modal.service';

describe('PlaylistModalService', () => {
  let service: PlaylistModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlaylistModalService] });
    service = TestBed.inject(PlaylistModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('PM1: openPrompt sets promptConfig, resolves on closePrompt', fakeAsync(() => {
    let result: string | null = 'pending';
    service.openPrompt('Title', 'init').then((v) => (result = v));
    expect(service.promptConfig()).toEqual({ title: 'Title', initialValue: 'init' });

    service.closePrompt('hello');
    tick();
    expect(result).toBe('hello');
    expect(service.promptConfig()).toBeNull();
  }));

  it('PM2: openPrompt clears confirmConfig', fakeAsync(() => {
    service.openConfirm('msg');
    expect(service.confirmConfig()).toBeTruthy();

    service.openPrompt('Title');
    expect(service.confirmConfig()).toBeNull();
    service.closePrompt(null);
    tick();
  }));

  it('PM3: closePrompt(null) resolves with null', fakeAsync(() => {
    let result: string | null = 'pending';
    service.openPrompt('Title').then((v) => (result = v));
    service.closePrompt(null);
    tick();
    expect(result).toBeNull();
  }));

  it('PM4: openConfirm sets confirmConfig, resolves on closeConfirm', fakeAsync(() => {
    let result: unknown = 'pending';
    service.openConfirm('Delete?', 'Delete').then((v) => (result = v));
    expect(service.confirmConfig()).toEqual({ message: 'Delete?', confirmLabel: 'Delete' });

    service.closeConfirm(true);
    tick();
    expect(result).toBe(true);
    expect(service.confirmConfig()).toBeNull();
  }));

  it('PM4b: closeConfirm(false) resolves with false', fakeAsync(() => {
    let result: unknown = 'pending';
    service.openConfirm('Delete?').then((v) => (result = v));
    service.closeConfirm(false);
    tick();
    expect(result).toBe(false);
  }));

  it('PM5: openConfirm clears promptConfig', fakeAsync(() => {
    service.openPrompt('Title');
    expect(service.promptConfig()).toBeTruthy();

    service.openConfirm('msg');
    expect(service.promptConfig()).toBeNull();
    service.closeConfirm(false);
    tick();
  }));
});
