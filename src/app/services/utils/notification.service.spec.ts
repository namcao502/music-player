import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty notifications', () => {
    expect(service.notifications().length).toBe(0);
  });

  it('should add an error notification', () => {
    service.error('Something went wrong');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('error');
    expect(service.notifications()[0].message).toBe('Something went wrong');
  });

  it('should add a warning notification', () => {
    service.warning('Be careful');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('warning');
  });

  it('should add a success notification', () => {
    service.success('All good');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('success');
  });

  it('should auto-dismiss after duration', () => {
    service.error('Auto dismiss', 3000);
    expect(service.notifications().length).toBe(1);
    jasmine.clock().tick(3001);
    expect(service.notifications().length).toBe(0);
  });

  it('should manually dismiss a notification', () => {
    service.error('Dismiss me');
    const id = service.notifications()[0].id;
    service.dismiss(id);
    expect(service.notifications().length).toBe(0);
  });

  it('should support multiple notifications', () => {
    service.error('Error 1');
    service.warning('Warning 1');
    service.success('Success 1');
    expect(service.notifications().length).toBe(3);
  });

  it('should assign unique ids to each notification', () => {
    service.error('Error 1');
    service.error('Error 2');
    const ids = service.notifications().map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('should not dismiss if duration is 0', () => {
    service.error('Persistent', 0);
    jasmine.clock().tick(10000);
    expect(service.notifications().length).toBe(1);
  });
});
