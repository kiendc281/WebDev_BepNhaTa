import { Routes } from '@angular/router';
import { AboutusComponent } from './aboutus/aboutus.component';
import { ChinhSachComponent } from './chinh-sach/chinh-sach.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { CongThucComponent } from './cong-thuc/cong-thuc.component';
import { ChiTietCongThucComponent } from './chi-tiet-cong-thuc/chi-tiet-cong-thuc.component';
import { SanPhamComponent } from './san-pham/san-pham.component';
import { ChiTietSanPhamComponent } from './chi-tiet-san-pham/chi-tiet-san-pham.component';
import { LenThucDonComponent } from './len-thuc-don/len-thuc-don.component';
import { BmibmrComponent } from './bmibmr/bmibmr.component';
import { BlogComponent } from './blog/blog.component';
import { LienHeComponent } from './lien-he/lien-he.component';
import { FaqComponent } from './faq/faq.component';
import { DangKyComponent } from './dang-ky/dang-ky.component';
import { DangNhapComponent } from './dang-nhap/dang-nhap.component';
import { QuenMatKhauComponent } from './quen-mat-khau/quen-mat-khau.component';
import { DatlaiComponent } from './quen-mat-khau/datlai/datlai.component';
import { NhapemailComponent } from './quen-mat-khau/nhapemail/nhapemail.component';
import { NhapmaComponent } from './quen-mat-khau/nhapma/nhapma.component';

export const routes: Routes = [
  { path: 'trang-chu', component: TrangChuComponent },
  { path: 'cong-thuc', component: CongThucComponent },
  { path: 'cong-thuc/:id', component: ChiTietCongThucComponent },
  { path: 'san-pham', component: SanPhamComponent },
  { path: 'chi-tiet-san-pham/:id', component: ChiTietSanPhamComponent },
  { path: 'len-thuc-don', component: LenThucDonComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'cong-cu', component: BmibmrComponent },
  { path: 'about-us', component: AboutusComponent },
  { path: 'chinh-sach', component: ChinhSachComponent },
  { path: 'chinh-sach/:id', component: ChinhSachComponent },
  { path: 'lien-he', component: LienHeComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'dang-ky', component: DangKyComponent },
  { path: 'dang-nhap', component: DangNhapComponent },
  { path: 'quen-mat-khau', component: QuenMatKhauComponent },
  { path: 'nhapemail', component: NhapemailComponent },
  { path: 'nhapma', component: NhapmaComponent },
  { path: 'datlai', component: DatlaiComponent },
  { path: '', component: TrangChuComponent },
  // { path: '', redirectTo: '/dang-nhap', pathMatch: 'full' },
];
