import { Routes } from '@angular/router';
import { SalesTrackerComponent } from './sales-tracker/sales-tracker.component';
import { FollowUpTrackerComponent } from './follow-up/follow-up-tracker.component';
import { QaScoresComponent } from './qa-scores/qa-scores.component';

export const routes: Routes = [
  { path: '', redirectTo: 'kpi', pathMatch: 'full' },
  { path: 'kpi', component: SalesTrackerComponent },
  { path: 'qa', component: QaScoresComponent },
  { path: 'follow-up', component: FollowUpTrackerComponent },
];