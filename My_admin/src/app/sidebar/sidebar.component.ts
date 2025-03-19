import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // Submenu state
  openSubmenu: string | null = null;

  constructor(private router: Router) {}

  // Toggle submenu function và điều hướng nếu đang đóng
  toggleSubmenu(menuName: string): void {
    // Nếu menu đã mở, đóng lại
    if (this.openSubmenu === menuName) {
      this.openSubmenu = null;
    }
    // Nếu menu đang đóng, mở ra và điều hướng đến mục đầu tiên
    else {
      this.openSubmenu = menuName;

      // Điều hướng đến trang mục đầu tiên tương ứng
      if (menuName === 'product') {
        this.router.navigate(['/product']);
      } else if (menuName === 'customer') {
        this.router.navigate(['/customer']);
      }
    }
  }

  // Kiểm tra xem URL hiện tại có thuộc về route cụ thể không
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
