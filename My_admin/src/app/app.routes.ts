import { Routes } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { ProductComponent } from './product/product.component';
import { OrderComponent } from './order/order.component';
import { CustomerComponent } from './customer/customer.component';
import { BlogComponent } from './blog/blog.component';
import { RecipeComponent } from './recipe/recipe.component';
import { RecipesDetailComponent } from './recipes-detail/recipes-detail.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { BlogEditComponent } from './blog-edit/blog-edit.component';
import { BlogAddComponent } from './blog-add/blog-add.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: '/trang-chu', pathMatch: 'full' },
  { path: 'login', component: DangNhapComponent },
  { path: 'product', component: ProductComponent },
  { path: 'orders', component: OrderComponent },
  { path: 'order', component: OrderComponent },
  { path: 'order-detail/:id', component: OrderDetailComponent },
  { path: 'customers', component: CustomerComponent },
  { path: 'customers/:id', component: CustomerDetailComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'blog/detail/:id', component: BlogDetailComponent },
  { path: 'blog/edit/:id', component: BlogEditComponent },
  { path: 'blog/add', component: BlogAddComponent },
  { path: 'recipe', component: RecipeComponent },
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
    path: 'cong-thuc',
    loadComponent: () =>
      import('./recipe/recipe.component').then((m) => m.RecipeComponent),
  },
  {
    path: 'cong-thuc/them-moi',
    loadComponent: () =>
      import('./recipes-detail/recipes-detail.component').then(
        (m) => m.RecipesDetailComponent
      ),
  },
  {
    path: 'cong-thuc/:id',
    loadComponent: () =>
      import('./recipes-detail/recipes-detail.component').then(
        (m) => m.RecipesDetailComponent
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
