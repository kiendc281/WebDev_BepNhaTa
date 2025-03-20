import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { ProductComponent } from './product/product.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { OrderComponent } from './order/order.component';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { RecipeComponent } from './recipe/recipe.component';
import { RecipesDetailComponent } from './recipes-detail/recipes-detail.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DangNhapComponent,
    TrangChuComponent,
    ProductComponent,
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    ProductDetailComponent,
    OrderComponent,
    OrderDetailComponent,
    RecipeComponent,
    RecipesDetailComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'My_admin';
}
