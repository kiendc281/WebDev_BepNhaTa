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
  toggleSubmenu(menuName: string, targetSubmenu?: string): void {
    // Nếu menu đã mở, đóng lại
    if (this.openSubmenu === menuName) {
      this.openSubmenu = null;
    }
    // Nếu menu đang đóng, mở ra và điều hướng đến mục đầu tiên
    else {
      this.openSubmenu = menuName;

      // Nếu có chỉ định submenu cụ thể
      if (targetSubmenu) {
        this.router.navigate([targetSubmenu]);
      }
      // Nếu không, điều hướng đến trang mục đầu tiên tương ứng
      else if (menuName === 'product') {
        this.router.navigate(['/product']);
      } else if (menuName === 'customer') {
        this.router.navigate(['/customer']);
      }
    }
  }

  // Kiểm tra xem URL hiện tại có thuộc về route cụ thể không
  isActive(route: string): boolean {
    if (route === '/product') {
      // Trường hợp đặc biệt cho trang product
      return (
        this.router.url.includes('/product') ||
        this.router.url.includes('/san-pham')
      );
    }
    return this.router.url.includes(route);
  }
}
