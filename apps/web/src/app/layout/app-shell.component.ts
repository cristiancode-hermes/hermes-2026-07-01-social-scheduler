import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBarComponent } from './top-bar.component';
import { SidebarComponent } from './sidebar.component';
import { BottomNavComponent } from './bottom-nav.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, TopBarComponent, SidebarComponent, BottomNavComponent],
  template: `
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <app-top-bar (toggleSidebar)="sidebarOpen.set(!sidebarOpen())" />

      <div class="flex">
        <app-sidebar
          [open]="sidebarOpen()"
          (navigate)="sidebarOpen.set(false)"
        />

        @if (sidebarOpen()) {
          <div
            class="fixed inset-0 z-30 bg-black/30 lg:hidden"
            (click)="sidebarOpen.set(false)"
          ></div>
        }

        <main class="flex-1 min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
          <router-outlet />
        </main>
      </div>

      <app-bottom-nav />
    </div>
  `,
})
export class AppShellComponent {
  protected readonly sidebarOpen = signal(false);

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 1024) {
      this.sidebarOpen.set(false);
    }
  }
}
