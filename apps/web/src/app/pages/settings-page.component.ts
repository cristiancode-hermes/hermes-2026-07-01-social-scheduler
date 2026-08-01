import { Component, signal, effect, inject } from '@angular/core';
import { PlatformService } from '../services/platform.service';
import { ButtonComponent } from '../shared/button.component';
import { BadgeComponent } from '../shared/badge.component';
import { ModalComponent } from '../shared/modal.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { LoadingSkeletonComponent } from '../shared/loading-skeleton.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import type { Platform, PlatformProfile } from '../models';
import { PLATFORM_LABELS } from '../models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ButtonComponent, BadgeComponent, ModalComponent, EmptyStateComponent, LoadingSkeletonComponent, ConfirmDialogComponent],
  template: `
<div class="p-4 lg:p-6 space-y-6">
<div>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Settings</h1>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">Manage your platform profiles</p>
</div>

<!-- Platform Profiles -->
<div class="bg-surface-card dark:bg-neutral-900 rounded-card -card">
<div class="px-6 py-4 border-b border-border dark:border-neutral-800 flex items-center justify-between">
<div>
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark">Platform Profiles</h2>
<p class="text-sm text-text-secondary dark:text-text-secondary-dark">Connect your social media accounts</p>
</div>
<app-button variant="primary" size="sm" (onClick)="showAddModal.set(true)">
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
Add Profile
</app-button>
</div>

<div class="p-6">
@if (platformService.loading() && platformService.profiles().length === 0) {
<div class="space-y-3">
@for (i of [1,2,3]; track i) {
<app-loading-skeleton variant="row" />
}
</div>
} @else if (platformService.profiles().length === 0) {
<app-empty-state
title="No profiles connected"
description="Add a social media platform profile to start scheduling posts"
[actionLabel]="'Add Profile'"
(action)="showAddModal.set(true)"
/>
} @else {
<div class="space-y-3">
@for (profile of platformService.profiles(); track profile.id) {
<div class="flex items-center justify-between p-4 rounded-btn border border-border dark:border-neutral-700 hover:bg-surface dark:hover:bg-neutral-800/50 transition-colors">
<div class="flex items-center gap-4">
<app-badge [variant]="profile.platform">{{ PLATFORM_LABELS[profile.platform] }}</app-badge>
<div>
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ profile.displayName }}</p>
<p class="text-xs text-text-secondary-dark">@{{ profile.handle }}</p>
</div>
</div>
<div class="flex items-center gap-2">
<button
(click)="editProfile(profile)"
class="p-1.5 rounded-btn hover:bg-surface dark:hover:bg-neutral-700 text-text-secondary-dark hover:text-neutral-600 dark:hover:text-text-primary-dark transition-colors"
>
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
</button>
<button
(click)="deleteTarget.set(profile)"
class="p-1.5 rounded-btn hover:bg-red-50 dark:hover:bg-red-950/20 text-text-secondary-dark hover:text-red-600 transition-colors"
>
<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
</button>
</div>
</div>
}
</div>
}
</div>
</div>

<!-- Add/Edit Profile Modal -->
<app-modal
[isOpen]="showAddModal()"
(close)="closeAddModal()"
[title]="editingProfile() ? 'Edit Profile' : 'Add Profile'"
size="md"
>
<form (ngSubmit)="onSaveProfile()" class="space-y-4">
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">Platform</label>
<div class="grid grid-cols-2 gap-2">
@for (p of platformOptions; track p.value) {
<button
type="button"
(click)="formPlatform.set(p.value)"
class="flex items-center justify-center gap-2 p-3 rounded-btn border-2 transition-all text-sm font-medium"
[class.border-accent]="formPlatform() === p.value"
[class.bg-accent-light]="formPlatform() === p.value"
[class.dark:bg-accent-light]="formPlatform() === p.value"
[class.border-border]="formPlatform() !== p.value"
[class.dark:border-neutral-700]="formPlatform() !== p.value"
>
{{ p.label }}
</button>
}
</div>
</div>

<div>
<label for="displayName" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Display Name</label>
<input
id="displayName"
type="text"
[value]="formDisplayName()"
(input)="formDisplayName.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
placeholder="My Brand Account"
required
/>
</div>

<div>
<label for="handle" class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Handle / Username</label>
<input
id="handle"
type="text"
[value]="formHandle()"
(input)="formHandle.set($any($event).target.value)"
class="w-full px-3 py-2.5 rounded-btn border border-border dark:border-neutral-700 bg-surface-card dark:bg-neutral-800 text-text-primary dark:text-text-primary-dark placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
placeholder="@username"
required
/>
</div>

@if (platformService.error()) {
<div class="p-3 rounded-btn bg-red-50 dark:bg-red-950/20 border border-danger-200 dark:border-danger-800">
<p class="text-sm text-red-700 dark:text-danger-300">{{ platformService.error() }}</p>
</div>
}

<div class="flex justify-end gap-3 pt-2">
<app-button type="button" variant="ghost" (onClick)="closeAddModal()">Cancel</app-button>
<app-button type="submit" variant="primary" [loading]="platformService.loading()" [disabled]="!formDisplayName() || !formHandle() || !formPlatform()">
{{ editingProfile() ? 'Update' : 'Add' }} Profile
</app-button>
</div>
</form>
</app-modal>

<app-confirm-dialog
[isOpen]="deleteTarget() !== null"
title="Delete Profile"
[message]="'Are you sure you want to delete the profile for @' + (deleteTarget()?.handle || '') + '? Posts using this profile will be affected.'"
(confirm)="confirmDelete()"
(cancel)="deleteTarget.set(null)"
/>
</div>
`,
})
export class SettingsPageComponent {
  protected readonly platformService = inject(PlatformService);
  protected readonly showAddModal = signal(false);
  protected readonly editingProfile = signal<PlatformProfile | null>(null);
  protected readonly deleteTarget = signal<PlatformProfile | null>(null);

  protected readonly formPlatform = signal<Platform | ''>('');
  protected readonly formDisplayName = signal('');
  protected readonly formHandle = signal('');

  protected readonly PLATFORM_LABELS = PLATFORM_LABELS;

  protected readonly platformOptions: { value: Platform; label: string }[] = [
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
  ];

  constructor() {
    effect(() => {
      this.platformService.loadProfiles();
    });
  }

  protected editProfile(profile: PlatformProfile): void {
    this.editingProfile.set(profile);
    this.formPlatform.set(profile.platform);
    this.formDisplayName.set(profile.displayName);
    this.formHandle.set(profile.handle);
    this.showAddModal.set(true);
  }

  protected closeAddModal(): void {
    this.showAddModal.set(false);
    this.editingProfile.set(null);
    this.formPlatform.set('');
    this.formDisplayName.set('');
    this.formHandle.set('');
  }

  protected onSaveProfile(): void {
    if (this.editingProfile()) {
      this.platformService.updateProfile(this.editingProfile()!.id, {
        platform: this.formPlatform() as Platform,
        displayName: this.formDisplayName(),
        handle: this.formHandle(),
      });
    } else {
      this.platformService.createProfile({
        platform: this.formPlatform() as Platform,
        displayName: this.formDisplayName(),
        handle: this.formHandle(),
      });
    }
    this.closeAddModal();
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (target) {
      this.platformService.deleteProfile(target.id);
      this.deleteTarget.set(null);
    }
  }
}
