import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, DangNhapComponent, DangKyComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  showLoginPopup = false;
  isLoginForm = true; // true for login, false for register

  constructor(private router: Router) {}

  toggleLoginPopup() {
    this.showLoginPopup = !this.showLoginPopup;
    this.isLoginForm = true; // Reset to login form when toggling
  }

  closeLoginPopup(event?: MouseEvent) {
    if (
      !event ||
      (event.target as HTMLElement).classList.contains('popup-overlay')
    ) {
      this.showLoginPopup = false;
    }
  }

  switchForm() {
    this.isLoginForm = !this.isLoginForm;
  }

  navigateToLogin() {
    this.router.navigate(['/dang-nhap']);
  }
}
