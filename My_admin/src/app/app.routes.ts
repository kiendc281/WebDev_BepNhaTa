import { Routes } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: DangNhapComponent },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: '**', redirectTo: '/login' }
];
