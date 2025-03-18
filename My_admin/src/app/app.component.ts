import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { ProductComponent } from './product/product.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';

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
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'My_admin';
}
