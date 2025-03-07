import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
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
export class HeaderComponent {
  showLoginPopup = false;
  currentForm = 'login'; // 'login', 'register', or 'forgot'

  constructor(private router: Router) {}

  toggleLoginPopup() {
    this.showLoginPopup = !this.showLoginPopup;
    this.currentForm = 'login'; // Reset to login form when toggling
  }

  closeLoginPopup(event?: MouseEvent) {
    if (
      !event ||
      (event.target as HTMLElement).classList.contains('popup-overlay')
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
}
