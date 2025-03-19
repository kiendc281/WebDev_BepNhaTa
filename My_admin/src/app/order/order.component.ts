import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { OrderService } from '../services/order.service';
import { Order, OrderFilter, OrderStatus } from '../models/order.interface';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css',
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  pagedOrders: Order[] = [];

  // Các giá trị cho lọc
  statusOptions: OrderStatus[] = [
    'Đã hủy',
    'Hoàn thành',
    'Đang giao hàng',
    'Chờ lấy hàng',
    'Chờ xác nhận',
  ];

  selectedStatusFilter: OrderStatus | '' = '';
  priceRangeFilter: { min: number | null; max: number | null } = {
    min: null,
    max: null,
  };
  showPriceFilter: boolean = false;
  showStatusFilter: boolean = false;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.filteredOrders = [...this.orders];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    this.goToPage(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const startIndex = (page - 1) * this.itemsPerPage;
      const endIndex = Math.min(
        startIndex + this.itemsPerPage,
        this.filteredOrders.length
      );
      this.pagedOrders = this.filteredOrders.slice(startIndex, endIndex);
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  toggleStatusFilter(): void {
    this.showStatusFilter = !this.showStatusFilter;
  }

  togglePriceFilter(): void {
    this.showPriceFilter = !this.showPriceFilter;
  }

  applyStatusFilter(status: OrderStatus | ''): void {
    this.selectedStatusFilter = status;
    this.applyFilters();
    this.showStatusFilter = false;
  }

  applyPriceFilter(): void {
    this.applyFilters();
    this.showPriceFilter = false;
  }

  applyFilters(): void {
    const filter: OrderFilter = {};

    if (this.selectedStatusFilter) {
      filter.status = this.selectedStatusFilter;
    }

    if (this.priceRangeFilter.min !== null) {
      filter.minPrice = this.priceRangeFilter.min;
    }

    if (this.priceRangeFilter.max !== null) {
      filter.maxPrice = this.priceRangeFilter.max;
    }

    if (Object.keys(filter).length === 0) {
      // Nếu không có bộ lọc nào được áp dụng, hiển thị tất cả đơn hàng
      this.filteredOrders = [...this.orders];
    } else {
      this.orderService.filterOrders(filter).subscribe((orders) => {
        this.filteredOrders = orders;
        this.updatePagination();
      });
    }
  }

  resetFilters(): void {
    this.selectedStatusFilter = '';
    this.priceRangeFilter = { min: null, max: null };
    this.filteredOrders = [...this.orders];
    this.updatePagination();
  }

  viewOrderDetails(id: string): void {
    console.log('View order details:', id);
    // Chuyển hướng đến trang chi tiết đơn hàng
    // this.router.navigate(['/orders', id]);
  }

  deleteOrder(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: (success) => {
          if (success) {
            this.orders = this.orders.filter((order) => order._id !== id);
            this.filteredOrders = this.filteredOrders.filter(
              (order) => order._id !== id
            );
            this.updatePagination();
          } else {
            alert('Không thể xóa đơn hàng. Vui lòng thử lại sau.');
          }
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          alert('Đã xảy ra lỗi khi xóa đơn hàng. Vui lòng thử lại sau.');
        },
      });
    }
  }
}
