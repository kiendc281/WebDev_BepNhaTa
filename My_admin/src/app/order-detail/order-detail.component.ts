import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit {
  orderId: string = '20250224P01';
  orderDate: string = '24/02/2025';
  paymentMethod: string = 'COD';
  status: string = 'Hoàn thành';

  orderItems: OrderItem[] = [
    {
      id: 1,
      name: 'Gói nguyên liệu bún bò Huế',
      quantity: 3,
      price: 90000,
      total: 270000,
    },
    {
      id: 2,
      name: 'Gói nguyên liệu phở',
      quantity: 2,
      price: 90000,
      total: 180000,
    },
  ];

  subtotal: number = 450000;
  shippingFee: number = 50000;
  shippingDiscount: number = 0;
  total: number = 500000;

  customer = {
    name: 'Tiến Đạt',
    phone: '0912345678',
    address: '212 Quang Trung, P12, Quận Gò Vấp, tp. Hồ Chí Minh',
    note: 'Không có',
  };

  constructor() {}

  ngOnInit(): void {}

  goBack(): void {
    window.history.back();
  }
}
