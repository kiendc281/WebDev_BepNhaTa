import { Component, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { FaqComponent } from './faq/faq.component';
import { ChinhSachComponent } from './chinh-sach/chinh-sach.component';
import { BmibmrComponent } from './bmibmr/bmibmr.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    HeaderComponent,
    AboutusComponent,
    FooterComponent,
    FaqComponent,
    ChinhSachComponent,
    BmibmrComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
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
