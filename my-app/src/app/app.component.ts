import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
  Scroll,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { FaqComponent } from './faq/faq.component';
import { ChinhSachComponent } from './chinh-sach/chinh-sach.component';
import { BmibmrComponent } from './bmibmr/bmibmr.component';
import { CongThucComponent } from './cong-thuc/cong-thuc.component';
import { LenThucDonComponent } from './len-thuc-don/len-thuc-don.component';
import { LienHeComponent } from './lien-he/lien-he.component';
import { SanPhamComponent } from './san-pham/san-pham.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { DangKyComponent } from './dang-ky/dang-ky.component';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { QuenMatKhauComponent } from './quen-mat-khau/quen-mat-khau.component';
import { DatlaiComponent } from './quen-mat-khau/datlai/datlai.component';
import { NhapmaComponent } from './quen-mat-khau/nhapma/nhapma.component';
import { NhapemailComponent } from './quen-mat-khau/nhapemail/nhapemail.component';
import { TaiKhoanComponent } from './tai-khoan/tai-khoan.component';
import { ChiTietCongThucComponent } from './chi-tiet-cong-thuc/chi-tiet-cong-thuc.component';
import { GioHangComponent } from './gio-hang/gio-hang.component';
import { ChiTietBlogComponent } from './chi-tiet-blog/chi-tiet-blog.component';
import { ChiTietSanPhamComponent } from './chi-tiet-san-pham/chi-tiet-san-pham.component';
import { BlogComponent } from './blog/blog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    RouterLinkActive,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    AboutusComponent,
    BmibmrComponent,
    ChinhSachComponent,
    CongThucComponent,
    FaqComponent,
    LenThucDonComponent,
    LienHeComponent,
    SanPhamComponent,
    TrangChuComponent,
    DangKyComponent,
    DangNhapComponent,
    QuenMatKhauComponent,
    DatlaiComponent,
    NhapmaComponent,
    NhapemailComponent,
    TaiKhoanComponent,
    ChiTietCongThucComponent,
    GioHangComponent,
    ChiTietBlogComponent,
    ChiTietSanPhamComponent,
    BlogComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'my-app';
  private router: Router; //auto scroll top when route

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.router.events.subscribe((x) => {
      if (x instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
  }
}
