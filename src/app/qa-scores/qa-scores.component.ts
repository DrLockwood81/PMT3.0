import { Component, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface QaReview {
  id: string;
  date: string;
  rating: number; // 0 to 5
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
  // Department Target Threshold
  protected readonly goalThreshold = 62;

  // Actual Input Signals
  protected actualRating = signal<number | null>(null);
  protected actualNotes = signal<string>('');

  // Potential Input Signal ("What if?" score test)
  protected potentialRating = signal<number | null>(null);

  // Reviews Signal persisted in LocalStorage
  protected reviews = signal<QaReview[]>(this.loadReviews());

  // Auto-sync to LocalStorage
  private saveEffect = effect(() => {
    localStorage.setItem('qa_reviews_data', JSON.stringify(this.reviews()));
  });

  // Maps 0-5 rating to 0-100% score bracket (0=0%, 1=25%, 2=50%, 3=75%, 4/5=100%)
  protected calculatePercentage(rating: number): number {
    switch (rating) {
      case 0: return 0;
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      case 4:
      case 5: return 100;
      default: return 0;
    }
  }

  // Computed Current Average QA Score Percentage
  protected currentAverage = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const total = list.reduce((sum, item) => sum + item.percentage, 0);
    return total / list.length;
  });

  // Computed Potential Average Score Percentage
  protected potentialAverage = computed(() => {
    const pot = this.potentialRating();
    if (pot === null) return this.currentAverage();
    
    const potPercent = this.calculatePercentage(pot);
    const list = this.reviews();
    const total = list.reduce((sum, item) => sum + item.percentage, 0) + potPercent;
    return total / (list.length + 1);
  });

  // Save Actual Review Score
  protected addActualReview(): void {
    const ratingVal = this.actualRating();
    if (ratingVal === null || ratingVal < 0 || ratingVal > 5) return;

    const review: QaReview = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: ratingVal,
      percentage: this.calculatePercentage(ratingVal),
      notes: this.actualNotes().trim()
    };

    this.reviews.update(current => [review, ...current]);
    
    // Clear inputs
    this.actualRating.set(null);
    this.actualNotes.set('');
  }

  // Delete Individual Review
  protected deleteReview(id: string): void {
    this.reviews.update(current => current.filter(r => r.id !== id));
  }

  // Read LocalStorage Data
  private loadReviews(): QaReview[] {
    const saved = localStorage.getItem('qa_reviews_data');
    return saved ? JSON.parse(saved) : [];
  }
}