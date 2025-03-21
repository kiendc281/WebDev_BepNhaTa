import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
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

  // Sắp xếp
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

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
        this.sortCustomers();
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

  // Sắp xếp
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Nếu đang sắp xếp theo cột này, đảo ngược thứ tự
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu sắp xếp theo cột mới, mặc định là tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortCustomers();
    this.updatePagedCustomers();
  }

  sortCustomers(): void {
    if (!this.sortColumn) return;

    this.customers.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Lấy giá trị theo cột đang sắp xếp
      switch (this.sortColumn) {
        case 'username':
          valueA = a.username ? a.username.toLowerCase() : '';
          valueB = b.username ? b.username.toLowerCase() : '';
          break;
        case 'fullName':
          valueA = a.fullName ? a.fullName.toLowerCase() : '';
          valueB = b.fullName ? b.fullName.toLowerCase() : '';
          break;
        case 'phone':
          valueA = a.phone;
          valueB = b.phone;
          break;
        case 'email':
          valueA = a.email ? a.email.toLowerCase() : '';
          valueB = b.email ? b.email.toLowerCase() : '';
          break;
        case 'address':
          valueA = a.address ? a.address.toLowerCase() : '';
          valueB = b.address ? b.address.toLowerCase() : '';
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt || '');
          valueB = new Date(b.createdAt || '');
          break;
        default:
          return 0;
      }

      // So sánh và sắp xếp
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi bi-filter'; // Icon mặc định khi chưa sắp xếp
    }
    return this.sortDirection === 'asc' ? 'bi-sort-down-alt' : 'bi-sort-up-alt';
  }

  editCustomer(id: string): void {
    console.log('Edit customer with ID:', id);
    this.router.navigate(['/customers', id]);
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
