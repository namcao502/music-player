import { TestBed } from '@angular/core/testing';
import { PlaylistModalComponent } from './playlist-modal.component';
import { PlaylistModalService } from '../../services/playlist-modal.service';

describe('PlaylistModalComponent', () => {
  let service: PlaylistModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistModalComponent],
      providers: [PlaylistModalService]
    }).compileComponents();
    service = TestBed.inject(PlaylistModalService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('MC1: onPromptSubmit calls closePrompt with trimmed value', () => {
    spyOn(service, 'closePrompt');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.componentInstance.promptValue.set('  hello  ');
    fixture.componentInstance.onPromptSubmit();
    expect(service.closePrompt).toHaveBeenCalledWith('hello');
  });

  it('MC2: onPromptCancel calls closePrompt(null)', () => {
    spyOn(service, 'closePrompt');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.componentInstance.onPromptCancel();
    expect(service.closePrompt).toHaveBeenCalledWith(null);
  });

  it('MC3: onConfirmYes calls closeConfirm(true)', () => {
    spyOn(service, 'closeConfirm');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.componentInstance.onConfirmYes();
    expect(service.closeConfirm).toHaveBeenCalledWith(true);
  });

  it('MC4: onConfirmNo calls closeConfirm(false)', () => {
    spyOn(service, 'closeConfirm');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.componentInstance.onConfirmNo();
    expect(service.closeConfirm).toHaveBeenCalledWith(false);
  });

  it('MC5: onBackdropClick on prompt backdrop calls closePrompt(null)', () => {
    service.openPrompt('Title');
    spyOn(service, 'closePrompt');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.detectChanges();

    const backdropEl = document.createElement('div');
    backdropEl.classList.add('modal-backdrop');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: backdropEl });

    fixture.componentInstance.onBackdropClick(event);
    expect(service.closePrompt).toHaveBeenCalledWith(null);
  });

  it('MC5b: onBackdropClick on confirm backdrop calls closeConfirm(false)', () => {
    service.openConfirm('Sure?');
    spyOn(service, 'closeConfirm');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.detectChanges();

    const backdropEl = document.createElement('div');
    backdropEl.classList.add('modal-backdrop');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: backdropEl });

    fixture.componentInstance.onBackdropClick(event);
    expect(service.closeConfirm).toHaveBeenCalledWith(false);
  });

  it('MC5c: onBackdropClick on non-backdrop element does nothing', () => {
    service.openPrompt('Title');
    spyOn(service, 'closePrompt');
    const fixture = TestBed.createComponent(PlaylistModalComponent);
    fixture.detectChanges();

    const dialogEl = document.createElement('div');
    dialogEl.classList.add('modal-dialog');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: dialogEl });

    fixture.componentInstance.onBackdropClick(event);
    expect(service.closePrompt).not.toHaveBeenCalled();
  });
});
