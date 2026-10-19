import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface FollowUp {
  accountId: string;
  date: string;
  note: string;
}

function isFollowUp(value: unknown): value is FollowUp {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
   'accountId' in value &&
    typeof value.accountId === 'string' &&
    'date' in value &&
    typeof value.date === 'string' &&
    'note' in value &&
    typeof value.note === 'string'
  );
}

function loadFollowUps(): FollowUp[] {
  const saved = localStorage.getItem('followUpData');

  if (saved === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);

  if (Array.isArray(parsed) && parsed.every(isFollowUp)) {
    return parsed;
  }

  // Keep a single follow-up saved by the earlier version of the form.
  if (isFollowUp(parsed)) {
    return [parsed];
  }

  throw new Error('Saved follow-up data is not in the expected format.');
}

@Component({
  selector: 'app-follow-up-tracker',
  imports: [ReactiveFormsModule],
  templateUrl: './follow-up-tracker.component.html',
})
export class FollowUpTrackerComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly DateForm = this.formBuilder.nonNullable.group({
    accountId: ['', Validators.required],
    date: ['', Validators.required],
    note: [''],
  });

  protected readonly followUps = signal<FollowUp[]>(loadFollowUps());

  protected save(): void {
    if (this.DateForm.invalid) {
      return;
    }

    const updatedFollowUps = [
      ...this.followUps(),
      this.DateForm.getRawValue(),
    ];

    localStorage.setItem('followUpData', JSON.stringify(updatedFollowUps));
    this.followUps.set(updatedFollowUps);
    this.DateForm.reset();
  }

  protected resetFollowUps(): void {
    if (window.confirm('Clear these saved items?')) {
      localStorage.removeItem('followUpData');
      this.followUps.set([]);
    }
  }
}