import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { OrderService } from '../services/order.service';
import { Order, OrderFilter, OrderStatus } from '../models/order.interface';
import { DatePipe } from '@angular/common';

interface ApiResponse {
  status?: string;
  message?: string;
  data?: Order[];
  orders?: Order[];
}

// Định nghĩa kiểu dữ liệu cho sắp xếp
type SortColumn = '_id' | 'orderDate' | 'totalPrice' | 'status' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    DatePipe,
  ],
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
    'Đang xử lý',
    'Đã xác nhận',
    'Đang giao hàng',
    'Đã giao hàng',
    'Đã hủy',
  ];

  selectedStatusFilter: OrderStatus | '' = '';
  priceRangeFilter: { min: number | null; max: number | null } = {
    min: null,
    max: null,
  };
  showPriceFilter: boolean = false;
  showStatusFilter: boolean = false;

  // Sắp xếp
  sortColumn: SortColumn = '';
  sortDirection: SortDirection = '';

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: (data) => {
        console.log('Data received from API:', data);

        // Đảm bảo this.orders luôn là một mảng
        if (Array.isArray(data)) {
          this.orders = data;
        } else if (data && typeof data === 'object') {
          const responseObj = data as unknown as ApiResponse;
          if (responseObj.orders && Array.isArray(responseObj.orders)) {
            this.orders = responseObj.orders;
          } else if (responseObj.data && Array.isArray(responseObj.data)) {
            this.orders = responseObj.data;
          } else {
            console.error(
              'API did not return an array or object with orders array',
              data
            );
            this.orders = [];
            this.error =
              'Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra API.';
          }
        } else {
          console.error('Unexpected data format received from API:', data);
          this.orders = [];
          this.error = 'Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra API.';
        }

        // Đảm bảo this.orders là mảng trước khi sử dụng spread operator
        this.filteredOrders = Array.isArray(this.orders)
          ? [...this.orders]
          : [];

        // Áp dụng sắp xếp nếu có
        if (this.sortColumn && this.sortDirection) {
          this.sortData(this.sortColumn, this.sortDirection);
        } else {
          this.updatePagination();
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.error = 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
        // Đảm bảo mảng rỗng khi có lỗi xảy ra
        this.orders = [];
        this.filteredOrders = [];
        this.pagedOrders = [];
      },
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1; // Đảm bảo luôn có ít nhất một trang
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
      // Đảm bảo this.orders là mảng trước khi sử dụng spread operator
      this.filteredOrders = Array.isArray(this.orders) ? [...this.orders] : [];
    } else {
      this.orderService.filterOrders(filter).subscribe({
        next: (orders) => {
          this.filteredOrders = orders || [];
          // Áp dụng lại sắp xếp hiện tại nếu có
          if (this.sortColumn && this.sortDirection) {
            this.sortData(this.sortColumn, this.sortDirection, false);
          } else {
            this.updatePagination();
          }
        },
        error: (err) => {
          console.error('Error applying filters:', err);
          this.filteredOrders = [];
          this.updatePagination();
        },
      });
    }
  }

  resetFilters(): void {
    this.selectedStatusFilter = '';
    this.priceRangeFilter = { min: null, max: null };
    // Đảm bảo this.orders là mảng trước khi sử dụng spread operator
    this.filteredOrders = Array.isArray(this.orders) ? [...this.orders] : [];
    // Áp dụng lại sắp xếp hiện tại nếu có
    if (this.sortColumn && this.sortDirection) {
      this.sortData(this.sortColumn, this.sortDirection, false);
    } else {
      this.updatePagination();
    }
  }

  viewOrderDetails(id: string): void {
    this.router.navigate(['/order-detail', id]);
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

  // Định dạng ngày tháng
  formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'N/A';
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  }

  // Lấy tên khách hàng từ guestInfo
  getCustomerName(order: Order): string {
    return order?.guestInfo?.fullName || 'N/A';
  }

  // Chức năng sắp xếp
  onSort(column: SortColumn): void {
    // Nếu click vào cùng một cột, đổi hướng sắp xếp
    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : this.sortDirection === 'desc'
          ? ''
          : 'asc';
    } else {
      // Nếu click vào cột khác, sắp xếp theo cột mới với hướng tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Nếu không có hướng sắp xếp, reset về trạng thái mặc định
    if (!this.sortDirection) {
      this.sortColumn = '';
      // Reset lại filteredOrders từ orders gốc
      this.filteredOrders = Array.isArray(this.orders) ? [...this.orders] : [];

      // Áp dụng lại bộ lọc nếu có
      if (
        this.selectedStatusFilter ||
        this.priceRangeFilter.min !== null ||
        this.priceRangeFilter.max !== null
      ) {
        this.applyFilters();
      } else {
        this.updatePagination();
      }
    } else {
      // Thực hiện sắp xếp dữ liệu
      this.sortData(this.sortColumn, this.sortDirection);
    }
  }

  sortData(
    column: SortColumn,
    direction: SortDirection,
    updatePage: boolean = true
  ): void {
    if (!column || !direction) return;

    const compare = (a: Order, b: Order): number => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case '_id':
          valueA = a._id || '';
          valueB = b._id || '';
          break;
        case 'orderDate':
          valueA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          valueB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          break;
        case 'totalPrice':
          valueA = a.totalPrice || 0;
          valueB = b.totalPrice || 0;
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        default:
          return 0;
      }

      // So sánh các giá trị
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    };

    // Sắp xếp dữ liệu
    this.filteredOrders = [...this.filteredOrders].sort(compare);

    // Cập nhật phân trang nếu cần
    if (updatePage) {
      this.updatePagination();
    }
  }

  // Lấy biểu tượng sắp xếp
  getSortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return 'bi bi-filter'; // Biểu tượng mặc định
    }

    if (this.sortDirection === 'asc') {
      return 'bi bi-sort-down-alt'; // Sắp xếp tăng dần
    } else if (this.sortDirection === 'desc') {
      return 'bi bi-sort-up'; // Sắp xếp giảm dần
    }

    return 'bi bi-arrow-down-up'; // Trở về biểu tượng mặc định khi không có sắp xếp
  }
}
