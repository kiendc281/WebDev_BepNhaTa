import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Customer } from '../models/customer.interface';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.css',
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  pagedCustomers: Customer[] = [];

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = null;

    this.customerService.getCustomers().subscribe({
      next: (data) => {
        console.log('Đã nhận dữ liệu khách hàng:', data);
        if (data && data.length > 0) {
          console.log('Mẫu khách hàng đầu tiên:', data[0]);
          console.log('Tên khách hàng đầu tiên:', data[0].fullName);
          console.log('Tên đăng nhập đầu tiên:', data[0].username);
        }
        this.customers = data;
        this.totalPages = Math.ceil(this.customers.length / this.itemsPerPage);
        this.updatePagedCustomers();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching customers:', err);
        this.error = 'Không thể tải dữ liệu khách hàng. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  updatePagedCustomers(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    const endItem = Math.min(
      startItem + this.itemsPerPage,
      this.customers.length
    );
    this.pagedCustomers = this.customers.slice(startItem, endItem);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedCustomers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedCustomers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedCustomers();
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  editCustomer(id: string): void {
    console.log('Edit customer with ID:', id);
    // Implement edit functionality
  }

  deleteCustomer(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.customers = this.customers.filter(
            (customer) => customer._id !== id
          );
          this.totalPages = Math.ceil(
            this.customers.length / this.itemsPerPage
          );

          // Nếu trang hiện tại không còn dữ liệu (trừ trường hợp đã ở trang 1)
          if (this.currentPage > 1 && this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }
          this.updatePagedCustomers();
        },
        error: (err) => {
          console.error('Error deleting customer:', err);
          alert('Không thể xóa khách hàng. Vui lòng thử lại sau.');
        },
      });
    }
  }
}
