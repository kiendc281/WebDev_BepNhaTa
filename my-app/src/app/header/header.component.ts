import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';
import { QuenMatKhauComponent } from '../quen-mat-khau/quen-mat-khau.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    DangNhapComponent,
    DangKyComponent,
    QuenMatKhauComponent,
  ],
  providers: [AuthService],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  showLoginPopup = false;
  currentForm = 'login'; // 'login', 'register', or 'forgot'
  mouseDownTarget: EventTarget | null = null;
  isMobileMenuOpen = false;
  activeDropdown: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  toggleLoginPopup() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/tai-khoan']);
    } else {
      this.showLoginPopup = !this.showLoginPopup;
      this.currentForm = 'login'; // Reset to login form when toggling
    }
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
