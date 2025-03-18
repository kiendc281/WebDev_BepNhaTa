import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { ProductComponent } from './product/product.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DangNhapComponent,
    TrangChuComponent,
    ProductComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'My_admin';
}
