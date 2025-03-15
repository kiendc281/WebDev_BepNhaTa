import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';
import { NhapemailComponent } from '../quen-mat-khau/nhapemail/nhapemail.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    DangNhapComponent,
    DangKyComponent,
    NhapemailComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  showLoginPopup = false;
  currentForm = 'login'; // 'login', 'register', or 'forgot'
  mouseDownTarget: EventTarget | null = null;
  isMobileMenuOpen = false;
  activeDropdown: string | null = null;
  currentRoute: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to router events to track the current route
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        // Handle query params
        if (this.currentRoute.includes('?')) {
          this.currentRoute = this.currentRoute.split('?')[0];
        }
      }
    });
  }

  toggleLoginPopup() {
    this.showLoginPopup = !this.showLoginPopup;
    this.currentForm = 'login'; // Reset to login form when toggling
  }

  onMouseDown(event: MouseEvent) {
    this.mouseDownTarget = event.target;
  }

  closeLoginPopup(event?: MouseEvent) {
    if (!event) {
      this.showLoginPopup = false;
      return;
    }

    if (
      (event.target as HTMLElement).classList.contains('popup-overlay') &&
      this.mouseDownTarget === event.target
    ) {
      this.showLoginPopup = false;
    }
  }

  switchToRegister() {
    this.currentForm = 'register';
  }

  switchToLogin() {
    this.currentForm = 'login';
  }

  switchToForgotPass() {
    this.currentForm = 'forgot';
  }

  navigateToLogin() {
    this.router.navigate(['/dang-nhap']);
  }

  // Mobile menu methods
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevent scrolling when mobile menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      this.activeDropdown = null;
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
    this.activeDropdown = null;
  }

  toggleDropdown(dropdown: string, event: Event) {
    event.preventDefault();
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = dropdown;
    }
  }
}
