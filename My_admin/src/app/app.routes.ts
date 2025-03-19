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
  {
    path: 'san-pham/them-moi',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'san-pham/chinh-sua/:id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  { path: '**', redirectTo: '/trang-chu' },
];
