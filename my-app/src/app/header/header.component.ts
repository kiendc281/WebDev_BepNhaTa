import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';
import { NhapemailComponent } from '../quen-mat-khau/nhapemail/nhapemail.component';
import { AuthService } from '../services/auth.service';

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
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Xóa token cũ khi khởi động component
    // Bỏ comment dòng này nếu bạn muốn luôn reset trạng thái đăng nhập khi tải lại trang
    // localStorage.removeItem('token');
  }

  toggleLoginPopup() {
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('Trạng thái đăng nhập:', isLoggedIn);
    
    if (isLoggedIn) {
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
}
