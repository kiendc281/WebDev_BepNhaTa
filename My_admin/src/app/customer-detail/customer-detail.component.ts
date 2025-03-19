import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CustomerService } from '../services/customer.service';
import { Customer } from '../models/customer.interface';

interface OrderItem {
  productName: string;
  productImage: string;
}

interface Order {
  _id: string;
  orderDate: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
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
    private customerService: CustomerService
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
    // Giả lập dữ liệu đơn hàng - trong thực tế, bạn cần gọi API riêng để lấy lịch sử đơn hàng
    this.orders = [
      {
        _id: 'order1',
        orderDate: '21/02/2025',
        items: [
          {
            productName: 'Gói nguyên liệu bánh mì xíu mại',
            productImage: 'assets/products/product1.jpg',
          },
        ],
      },
      {
        _id: 'order2',
        orderDate: '20/02/2025',
        items: [
          {
            productName: 'Gói nguyên liệu bánh mì xíu mại',
            productImage: 'assets/products/product1.jpg',
          },
        ],
      },
    ];
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
