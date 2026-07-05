import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DarkModeService } from './dark-mode.service';

@Component({
  standalone: true,
  template: '',
})
class TestHostComponent {
  constructor(readonly service: DarkModeService) {}
}

describe('DarkModeService', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let service: DarkModeService;

  function createFixture() {
    fixture = TestBed.createComponent(TestHostComponent);
    service = fixture.componentInstance.service;
    fixture.detectChanges(); // flush effects
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the dark mode class on document
    document.documentElement.classList.remove('dark');

    // Mock matchMedia to default to light mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (_query: string) => ({
        matches: false,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('should be created', () => {
    createFixture();
    expect(service).toBeTruthy();
  });

  it('should default to light mode when no stored preference and no system preference', () => {
    createFixture();
    expect(service.isDark()).toBe(false);
  });

  it('should read stored dark mode preference from localStorage', () => {
    localStorage.setItem('dark_mode', 'true');
    createFixture();
    expect(service.isDark()).toBe(true);
  });

  it('should toggle dark mode on and off', () => {
    createFixture();
    expect(service.isDark()).toBe(false);

    service.toggle();
    expect(service.isDark()).toBe(true);

    service.toggle();
    expect(service.isDark()).toBe(false);
  });

  it('should persist toggle state to localStorage', () => {
    createFixture();
    // After detectChanges, the initial effect should have run
    expect(localStorage.getItem('dark_mode')).toBe('false');

    service.toggle();
    fixture.detectChanges(); // flush the effect
    expect(localStorage.getItem('dark_mode')).toBe('true');

    service.toggle();
    fixture.detectChanges(); // flush the effect
    expect(localStorage.getItem('dark_mode')).toBe('false');
  });

  it('should add/remove dark class on document element when toggling', () => {
    createFixture();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    service.toggle();
    fixture.detectChanges(); // flush the effect
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.toggle();
    fixture.detectChanges(); // flush the effect
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should respect system preference for dark mode when no stored preference', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (_query: string) => ({
        matches: true,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    createFixture();
    expect(service.isDark()).toBe(true);
  });

  it('should prefer stored preference over system preference', () => {
    localStorage.setItem('dark_mode', 'false');

    // Set system preference to dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (_query: string) => ({
        matches: true,
        media: _query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    createFixture();
    // Stored 'false' should override system preference
    expect(service.isDark()).toBe(false);
  });
});
