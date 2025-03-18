import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trang-chu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trang-chu.component.html',
  styleUrl: './trang-chu.component.css',
})
export class TrangChuComponent implements OnInit {
  // Dashboard data
  dashboardStats = {
    revenue: '123.456.789 VNĐ',
    totalOrders: '123.456.789 VNĐ',
    productsSold: '123.456.789 VNĐ',
    totalWebVisits: '123.789 truy cập',
    dailyVisits: '16.789 truy cập',
    catalogueViews: '1.789 lượt xem',
    articleViews: '123.789 lượt xem',
  };

  orderStatus = [
    { title: 'Đơn hàng chưa thanh toán', count: '1.200' },
    { title: 'Đơn hàng chờ xác nhận', count: '1.200' },
    { title: 'Đơn hàng đang giao', count: '1.200' },
    { title: 'Đơn hàng đã hủy', count: '1.200' },
  ];

  // Submenu state
  openSubmenu: string | null = null;

  constructor() {}

  ngOnInit(): void {
    // Load Font Awesome dynamically
    this.loadFontAwesome();
  }

  private loadFontAwesome(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);
  }

  // Toggle submenu function
  toggleSubmenu(menuName: string): void {
    if (this.openSubmenu === menuName) {
      this.openSubmenu = null;
    } else {
      this.openSubmenu = menuName;
    }
  }
}
