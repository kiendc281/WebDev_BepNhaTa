import { Routes } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: DangNhapComponent },
  {
    path: 'trang-chu',
    loadComponent: () =>
      import('./trang-chu/trang-chu.component').then(
        (m) => m.TrangChuComponent
      ),
  },
  { path: '**', redirectTo: '/login' },
];
