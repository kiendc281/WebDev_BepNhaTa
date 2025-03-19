import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Order, OrderFilter, OrderStatus } from '../models/order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private mockOrders: Order[] = [
    {
      _id: '1',
      orderCode: '20250221P01',
      customerName: 'Danh Đỗ',
      orderDate: '21/02/2025',
      totalAmount: 300000,
      status: 'Đã hủy',
    },
    {
      _id: '2',
      orderCode: '20250224P01',
      customerName: 'Tiến Đạt',
      orderDate: '24/02/2025',
      totalAmount: 500000,
      status: 'Hoàn thành',
    },
    {
      _id: '3',
      orderCode: '20250226P01',
      customerName: 'Hưng Trần',
      orderDate: '26/02/2025',
      totalAmount: 200000,
      status: 'Đang giao hàng',
    },
    {
      _id: '4',
      orderCode: '20250227P01',
      customerName: 'Kiên Đoàn',
      orderDate: '27/02/2025',
      totalAmount: 680000,
      status: 'Chờ lấy hàng',
    },
    {
      _id: '5',
      orderCode: '20250228P01',
      customerName: 'Đức Mạnh',
      orderDate: '28/02/2025',
      totalAmount: 340000,
      status: 'Chờ xác nhận',
    },
    {
      _id: '6',
      orderCode: '20250301P01',
      customerName: 'Lan Anh',
      orderDate: '01/03/2025',
      totalAmount: 420000,
      status: 'Hoàn thành',
    },
    {
      _id: '7',
      orderCode: '20250302P01',
      customerName: 'Minh Hoàng',
      orderDate: '02/03/2025',
      totalAmount: 180000,
      status: 'Đã hủy',
    },
    {
      _id: '8',
      orderCode: '20250303P01',
      customerName: 'Thu Hà',
      orderDate: '03/03/2025',
      totalAmount: 560000,
      status: 'Chờ xác nhận',
    },
    {
      _id: '9',
      orderCode: '20250304P01',
      customerName: 'Quang Huy',
      orderDate: '04/03/2025',
      totalAmount: 750000,
      status: 'Đang giao hàng',
    },
    {
      _id: '10',
      orderCode: '20250305P01',
      customerName: 'Mai Linh',
      orderDate: '05/03/2025',
      totalAmount: 390000,
      status: 'Chờ lấy hàng',
    },
  ];

  constructor(private http: HttpClient) {}

  // Lấy tất cả đơn hàng (sử dụng dữ liệu mẫu)
  getOrders(): Observable<Order[]> {
    return of(this.mockOrders);
  }

  // Lọc đơn hàng theo các tiêu chí
  filterOrders(filter: OrderFilter): Observable<Order[]> {
    let filteredOrders = this.mockOrders;

    // Lọc theo trạng thái
    if (filter.status) {
      filteredOrders = filteredOrders.filter(
        (order) => order.status === filter.status
      );
    }

    // Lọc theo giá trị
    if (filter.minPrice !== undefined) {
      filteredOrders = filteredOrders.filter(
        (order) => order.totalAmount >= filter.minPrice!
      );
    }

    if (filter.maxPrice !== undefined) {
      filteredOrders = filteredOrders.filter(
        (order) => order.totalAmount <= filter.maxPrice!
      );
    }

    return of(filteredOrders);
  }

  // Lấy chi tiết đơn hàng theo ID
  getOrderById(id: string): Observable<Order | undefined> {
    const order = this.mockOrders.find((order) => order._id === id);
    return of(order);
  }

  // Xóa đơn hàng (giả lập)
  deleteOrder(id: string): Observable<boolean> {
    const index = this.mockOrders.findIndex((order) => order._id === id);
    if (index !== -1) {
      this.mockOrders.splice(index, 1);
      return of(true);
    }
    return of(false);
  }
}
