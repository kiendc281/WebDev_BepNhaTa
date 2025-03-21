import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trang-chu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trang-chu.component.html',
  styleUrls: ['./trang-chu.component.css'],
})
export class TrangChuComponent implements OnInit {
  // Dashboard data
  dashboardStats = {
    revenue: '123.456.789 VNĐ',
    totalOrders: '1.234 đơn hàng',
    productsSold: '5.678 sản phẩm',
    totalWebVisits: '123.789',
    dailyVisits: '16.789',
    catalogueViews: '1.789 lượt xem',
    articleViews: '123.789 lượt xem',
  };

  orderStatus = [
    { title: 'Đơn hàng chưa thanh toán', count: '1.200' },
    { title: 'Đơn hàng chờ xác nhận', count: '856' },
    { title: 'Đơn hàng đang giao', count: '543' },
    { title: 'Đơn hàng đã hủy', count: '321' },
  ];

  // Current date
  currentDate: string = '';

  constructor() {}

  ngOnInit(): void {
    // Load Font Awesome dynamically
    this.loadFontAwesome();

    // Format current date
    this.formatCurrentDate();
  }

  private loadFontAwesome(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);
  }

  // Format current date in Vietnamese
  private formatCurrentDate(): void {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    this.currentDate = `Ngày ${day} tháng ${month}, ${year}`;
  }
}
