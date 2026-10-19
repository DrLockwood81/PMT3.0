import { Routes } from '@angular/router';
import { SalesTrackerComponent } from './sales-tracker/sales-tracker.component';
import { FollowUpTrackerComponent } from './follow-up/follow-up-tracker.component';

export const routes: Routes = [
  { path: '', redirectTo: 'kpi', pathMatch: 'full' },
  { path: 'kpi', component: SalesTrackerComponent },
  { path: 'follow-up', component: FollowUpTrackerComponent },
];
