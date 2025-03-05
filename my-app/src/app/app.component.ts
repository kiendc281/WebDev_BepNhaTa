import { Component, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
  Scroll,
} from '@angular/router';
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

@Component({
  selector: 'app-root',
  imports: [
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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
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
