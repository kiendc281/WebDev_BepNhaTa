import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';
import { QuenMatKhauComponent } from '../quen-mat-khau/quen-mat-khau.component';
import { Subscription } from 'rxjs';

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
export class HeaderComponent implements OnInit, OnDestroy {
  showLoginPopup = false;
  currentForm = 'login'; // 'login', 'register', or 'forgot'
  mouseDownTarget: EventTarget | null = null;
  isMobileMenuOpen = false;
  activeDropdown: string | null = null;
  currentRoute: string = '';
  cartItemCount: number = 0;
  private cartSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    // Subscribe to router events to track the current route
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        // Handle query params
        if (this.currentRoute.includes('?')) {
          this.currentRoute = this.currentRoute.split('?')[0];
        }
      }
    });

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe((items) => {
      this.cartItemCount = items.reduce((count, item) => count + item.quantity, 0);
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

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
