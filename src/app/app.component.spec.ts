import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';

describe('AppComponent', () => {
  let themeSpy: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    themeSpy = jasmine.createSpyObj('ThemeService', ['toggle', 'isDark']);
    themeSpy.isDark.and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: ThemeService, useValue: themeSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

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
});
