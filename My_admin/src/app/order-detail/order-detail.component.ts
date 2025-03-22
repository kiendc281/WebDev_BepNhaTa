import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { OrderService } from '../services/order.service';
import { Order, OrderStatus } from '../models/order.interface';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HttpClientModule,
    DatePipe,
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
})
export class OrderDetailComponent implements OnInit {
  orderId: string = '';
  order: Order = {} as Order;
  isLoading: boolean = true;
  error: string | null = null;
  isEditing: boolean = false;
  selectedStatus: string = '';

  // Các giá trị cho sửa đổi trạng thái
  statusOptions: OrderStatus[] = [
    'Đang xử lý',
    'Đã xác nhận',
    'Đang giao hàng',
    'Đã giao hàng',
    'Đã hủy',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.orderId = id;
        this.loadOrderDetails();
      } else {
        this.error = 'Không tìm thấy ID đơn hàng trong URL';
        this.isLoading = false;
      }
    });
  }

  loadOrderDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data) => {
        console.log('Order details received:', data);
        this.order = data;

        // Đảm bảo itemOrder luôn là một mảng
        if (!Array.isArray(this.order.itemOrder)) {
          console.warn('itemOrder không phải là mảng, đặt lại thành mảng rỗng');
          this.order.itemOrder = [];
        }

        this.selectedStatus = this.order.status || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching order details:', err);
        this.error = 'Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  getStatusText(status: string | undefined): string {
    if (!status) return 'N/A';

    // Map API status values to display text
    switch (status) {
      case 'Đang xử lý':
        return 'Đang xử lý';
      case 'Đã hủy':
        return 'Đã hủy';
      case 'Hoàn thành':
        return 'Hoàn thành';
      case 'Đang giao hàng':
        return 'Đang giao hàng';
      case 'Chờ lấy hàng':
        return 'Chờ lấy hàng';
      case 'Chờ xác nhận':
        return 'Chờ xác nhận';
      default:
        return status;
    }
  }

  enableEditing(): void {
    this.isEditing = true;
    this.selectedStatus = this.order.status || '';
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  saveStatus(): void {
    if (!this.orderId || this.selectedStatus === this.order.status) {
      this.isEditing = false;
      return;
    }

    this.isLoading = true;

    this.orderService
      .updateOrderStatus(this.orderId, this.selectedStatus as OrderStatus)
      .subscribe({
        next: (success) => {
          if (success) {
            // Cập nhật trạng thái hiện tại
            this.order.status = this.selectedStatus as OrderStatus;

            // Hiển thị hiệu ứng thành công
            const statusElement = document.querySelector('.status-badge');
            if (statusElement) {
              statusElement.classList.add('update-success');
              setTimeout(() => {
                statusElement.classList.remove('update-success');
              }, 2000);
            }

            // Hiển thị thông báo thành công
            alert('Cập nhật trạng thái đơn hàng thành công');
          } else {
            alert(
              'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.'
            );
          }
          this.isLoading = false;
          this.isEditing = false;
        },
        error: (err) => {
          console.error('Error updating order status:', err);
          this.isLoading = false;
          alert(
            'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.'
          );
        },
      });
  }

  deleteOrder(): void {
    if (!this.order) {
      alert('Không thể xóa: thiếu thông tin đơn hàng.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      this.isLoading = true;
      this.orderService.deleteOrder(this.order._id).subscribe({
        next: (success) => {
          if (success) {
            this.router.navigate(['/order']);
          } else {
            this.error = 'Không thể xóa đơn hàng.';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error deleting order:', err);
          this.error = 'Đã xảy ra lỗi khi xóa đơn hàng. Vui lòng thử lại sau.';
          this.isLoading = false;
        },
      });
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'bg-secondary';

    switch (status) {
      case 'Đang xử lý':
        return 'bg-secondary';
      case 'Đã xác nhận':
        return 'bg-warning';
      case 'Đã giao hàng':
        return 'bg-success';
      case 'Đã hủy':
        return 'bg-danger';
      case 'Đang giao hàng':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  // Format date to readable format
  formatDate(dateString?: string | Date): string {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      // Kiểm tra nếu ngày không hợp lệ
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      // Định dạng ngày: DD/MM/YYYY HH:MM
      return `${date.getDate().toString().padStart(2, '0')}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  }

  // Calculate subtotal
  calculateSubtotal(): number {
    if (!this.order) return 0;
    return this.order.prePrice || 0;
  }

  // Navigate back to orders list
  goBack(): void {
    this.router.navigate(['/order']);
  }

  // Cập nhật trạng thái từ nút
  updateStatus(status: OrderStatus): void {
    if (status === this.order.status) {
      return;
    }

    this.isLoading = true;
    this.orderService.updateOrderStatus(this.orderId, status).subscribe({
      next: (success) => {
        if (success) {
          // Cập nhật trạng thái hiện tại
          this.order.status = status;

          // Hiển thị thông báo thành công
          alert('Cập nhật trạng thái đơn hàng thành công');
          this.router.navigate(['/order']);
        } else {
          alert(
            'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.'
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.isLoading = false;
        alert(
          'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.'
        );
      },
    });
  }
}
