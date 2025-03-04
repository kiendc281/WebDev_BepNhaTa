import { Routes } from '@angular/router';
import { AboutusComponent } from './aboutus/aboutus.component';
import { ChinhSachComponent } from './chinh-sach/chinh-sach.component';
import { TrangChuComponent } from './trang-chu/trang-chu.component';
import { CongThucComponent } from './cong-thuc/cong-thuc.component';
import { SanPhamComponent } from './san-pham/san-pham.component';
import { LenThucDonComponent } from './len-thuc-don/len-thuc-don.component';
import { BmibmrComponent } from './bmibmr/bmibmr.component';
import { BlogComponent } from './blog/blog.component';
import { LienHeComponent } from './lien-he/lien-he.component';
import { FaqComponent } from './faq/faq.component';

export const routes: Routes = [
  { path: 'trang-chu', component: TrangChuComponent },
  { path: 'cong-thuc', component: CongThucComponent },
  { path: 'san-pham', component: SanPhamComponent },
  { path: 'len-thuc-don', component: LenThucDonComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'cong-cu', component: BmibmrComponent },
  { path: 'about-us', component: AboutusComponent },
  { path: 'chinh-sach', component: ChinhSachComponent },
  { path: 'chinh-sach/:id', component: ChinhSachComponent },
  { path: 'lien-he', component: LienHeComponent },
  { path: 'faq', component: FaqComponent },
];
