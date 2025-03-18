import { Routes } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';

export const routes: Routes = [
  { path: '', redirectTo: '/trang-chu', pathMatch: 'full' },
  { path: 'login', component: DangNhapComponent },
  {
    path: 'trang-chu',
    loadComponent: () =>
      import('./trang-chu/trang-chu.component').then(
        (m) => m.TrangChuComponent
      ),
  },
  {
    path: 'san-pham',
    loadComponent: () =>
      import('./product/product.component').then((m) => m.ProductComponent),
  },
  { path: '**', redirectTo: '/trang-chu' },
];
