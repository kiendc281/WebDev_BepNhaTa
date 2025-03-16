import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Bếp Nhà Ta - Trang Quản Trị</h1>
        <button class="logout-btn" (click)="logout()">Đăng xuất</button>
      </div>
      <div class="dashboard-content">
        <h2>Chào mừng đến với trang quản trị</h2>
        <p>Đây là trang quản trị của Bếp Nhà Ta. Vui lòng chọn chức năng từ menu.</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .dashboard-header h1 {
      color: #ff6600;
      margin: 0;
    }
    .logout-btn {
      background-color: #ff6600;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
    .logout-btn:hover {
      background-color: #e65c00;
    }
    .dashboard-content {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  `]
})
export class DashboardComponent {
  constructor(private router: Router, private authService: AuthService) {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
