import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CustomerService } from '../services/customer.service';
import { OrderService } from '../services/order.service';
import { Customer } from '../models/customer.interface';
import { Order, OrderItem, OrderStatus } from '../models/order.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, DatePipe],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css',
})
export class CustomerDetailComponent implements OnInit {
  customerId: string = '';
  customer: Customer | null = null;
  orders: Order[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.customerId = params['id'];
      this.loadCustomerDetails();
      this.loadCustomerOrders();
    });
  }

  loadCustomerDetails(): void {
    this.isLoading = true;
    this.error = null;

    this.customerService.getCustomer(this.customerId).subscribe({
      next: (data) => {
        this.customer = data;
        console.log('Customer data:', this.customer);
        console.log('Customer ID:', this.customer._id);
        console.log('Customer name:', this.customer.fullName);
        console.log('Date of birth:', this.customer.dateOfBirth);
        console.log(
          'Date of birth formatted:',
          this.customer.dateOfBirth
            ? new Date(this.customer.dateOfBirth).toLocaleDateString()
            : 'Not available'
        );
        console.log('Gender:', this.customer.gender);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading customer details:', err);
        this.error =
          'Không thể tải thông tin khách hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  loadCustomerOrders(): void {
    this.isLoading = true;
    this.orderService.getCustomerOrders(this.customerId).subscribe({
      next: (data) => {
        this.orders = data;
        console.log('Customer orders:', this.orders);

        // Kiểm tra tất cả các đơn hàng để tìm khóa liên kết đến khách hàng
        if (this.orders.length > 0) {
          console.log('Found orders for customer:', this.customerId);
          const firstOrder = this.orders[0];
          console.log('First order structure:', firstOrder);

          // Log tất cả các trường để xác định trường nào chứa ID khách hàng
          if (firstOrder.customerId) {
            console.log('Order.customerId:', firstOrder.customerId);
          }

          if (firstOrder.guestInfo) {
            console.log('Order.guestInfo:', firstOrder.guestInfo);
          }

          console.log(
            'First order items:',
            firstOrder.items || firstOrder.itemOrder || firstOrder.products
          );
          console.log('First order status:', firstOrder.status);
          console.log('First order date:', firstOrder.orderDate);
          console.log('First order total:', firstOrder.totalPrice);
        } else {
          console.log('No orders found for customer:', this.customerId);
          console.log('Check Orders service for more details');
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading customer orders:', err);
        this.orders = [];
        this.isLoading = false;
      },
    });
  }

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

      // Định dạng ngày: DD/MM/YYYY
      return `${date.getDate().toString().padStart(2, '0')}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/order-detail', orderId]);
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'secondary';

    switch (status) {
      case 'Đang xử lý':
        return 'secondary';
      case 'Đã xác nhận':
        return 'warning';
      case 'Đã giao hàng':
        return 'success';
      case 'Đã hủy':
        return 'danger';
      case 'Đang giao hàng':
        return 'info';
      default:
        return 'secondary';
    }
  }

  // Lấy danh sách sản phẩm từ đơn hàng, xử lý các trường hợp khác nhau
  getOrderItems(order: Order): OrderItem[] {
    if (order.items && order.items.length > 0) {
      return order.items;
    }
    if (order.itemOrder && order.itemOrder.length > 0) {
      return order.itemOrder;
    }
    if (order.products && order.products.length > 0) {
      return order.products;
    }
    return [];
  }

  // Tính đơn giá từ sản phẩm
  getUnitPrice(item: OrderItem): number {
    // Nếu có giá đơn vị
    if (item.price) {
      return item.price;
    }

    // Nếu không có, tính từ tổng giá và số lượng
    if (item.totalPrice && item.quantity) {
      return item.totalPrice / item.quantity;
    }

    // Nếu không có thông tin, trả về 0
    return 0;
  }
}
