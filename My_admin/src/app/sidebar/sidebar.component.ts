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
        this.router.navigate(['/san-pham']);
      } else if (menuName === 'recipe') {
        this.router.navigate(['/cong-thuc']);
      } else if (menuName === 'customer') {
        this.router.navigate(['/customer']);
      }
    }
  }

  // Kiểm tra xem URL hiện tại có thuộc về route chính không (cho menu item chính)
  isActive(route: string): boolean {
    if (route === '/product') {
      return (
        this.router.url.includes('/product') ||
        this.router.url.includes('/san-pham')
      );
    }
    if (route === '/recipe') {
      return (
        this.router.url.includes('/recipe') ||
        this.router.url.includes('/cong-thuc')
      );
    }
    return this.router.url.includes(route);
  }

  // Kiểm tra xem URL hiện tại có khớp chính xác với submenu item không
  isSubmenuItemActive(route: string): boolean {
    const currentUrl = this.router.url;

    // Phần công thức
    if (
      route === '/cong-thuc' &&
      (currentUrl === '/cong-thuc' || currentUrl === '/recipe')
    ) {
      return true;
    }

    if (route === '/cong-thuc/them-moi' && currentUrl.includes('/them-moi')) {
      return true;
    }

    if (
      route === '/cong-thuc' &&
      currentUrl.match(/\/cong-thuc\/[^\/]+$/) &&
      !currentUrl.includes('/them-moi')
    ) {
      return false;
    }

    // Phần sản phẩm
    if (
      route === '/san-pham' &&
      (currentUrl === '/san-pham' || currentUrl === '/product')
    ) {
      return true;
    }

    if (route === '/san-pham/them-moi' && currentUrl.includes('/them-moi')) {
      return true;
    }

    if (
      route === '/san-pham' &&
      currentUrl.match(/\/san-pham\/chinh-sua\/[^\/]+$/) &&
      !currentUrl.includes('/them-moi')
    ) {
      return false;
    }

    // Các trường hợp khác, sử dụng exact matching
    return currentUrl === route;
  }
}
