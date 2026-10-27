import { Component, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface QaReview {
  id: string;
  date: string;
  rating: number; // 0 to 4
  percentage: number; // 0%, 25%, 50%, 75%, 100%
  notes?: string;
}

@Component({
  standalone: true,
  selector: 'app-qa-scores',
  imports: [CommonModule, FormsModule],
  templateUrl: './qa-scores.component.html',
  styleUrl: './qa-scores.component.css'
})
export class QaScoresComponent {
  protected readonly goalThreshold = 62;

  protected actualRating = signal<number | null>(null);
  protected actualNotes = signal<string>('');
  protected potentialRating = signal<number | null>(null);

  protected reviews = signal<QaReview[]>(this.loadReviews());

  private saveEffect = effect(() => {
    localStorage.setItem('qa_reviews_data', JSON.stringify(this.reviews()));
  });

  protected calculatePercentage(rating: number): number {
    switch (Number(rating)) {
      case 0: return 0;   // Fail
      case 1: return 25;  // Poor
      case 2: return 50;  // Average
      case 3: return 75;  // Great
      case 4: return 100; // Exceptional
      default: return 0;
    }
  }

  protected updateActualRating(val: string | null): void {
    if (val === null || val === '' || val === 'null') {
      this.actualRating.set(null);
    } else {
      this.actualRating.set(Number(val));
    }
  }

  protected updatePotentialRating(val: string | null): void {
    if (val === null || val === '' || val === 'null') {
      this.potentialRating.set(null);
    } else {
      this.potentialRating.set(Number(val));
    }
  }

  protected currentAverage = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, item) => sum + item.percentage, 0);
    return total / list.length;
  });

  protected potentialAverage = computed(() => {
    const pot = this.potentialRating();
    if (pot === null || pot === undefined) return this.currentAverage();
    
    const potPercent = this.calculatePercentage(pot);
    const list = this.reviews();
    const total = list.reduce((sum, item) => sum + item.percentage, 0) + potPercent;
    return total / (list.length + 1);
  });

  protected addActualReview(): void {
    const ratingVal = this.actualRating();
    if (ratingVal === null || ratingVal === undefined || ratingVal < 0 || ratingVal > 4) return;

    const review: QaReview = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: ratingVal,
      percentage: this.calculatePercentage(ratingVal),
      notes: this.actualNotes().trim()
    };

    this.reviews.update(current => [review, ...current]);
    
    this.actualRating.set(null);
    this.actualNotes.set('');
  }

  // INSERT HERE (LINE 103)
  protected resetReviews(): void {
    if (!window.confirm('Are you sure you want to clear all logged QA scores?')) {
      return;
    }

    localStorage.removeItem('qa_reviews_data');
    this.reviews.set([]);
    this.actualRating.set(null);
    this.actualNotes.set('');
    this.potentialRating.set(null);
  }

  protected deleteReview(id: string): void {
    this.reviews.update(current => current.filter(r => r.id !== id));
  }

  private loadReviews(): QaReview[] {
    const saved = localStorage.getItem('qa_reviews_data');
    return saved ? JSON.parse(saved) : [];
  }
}