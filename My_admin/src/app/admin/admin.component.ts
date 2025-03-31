import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { Admin } from '../models/admin.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  admins: Admin[] = [];
  pagedAdmins: Admin[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Delete confirmation
  showDeleteConfirm: boolean = false;
  adminToDelete: Admin | null = null;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading = true;
    this.error = null;
    this.adminService.getAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.totalPages = Math.ceil(this.admins.length / this.itemsPerPage);
        this.updatePagedAdmins();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.error = 'Không thể tải danh sách admin. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  updatePagedAdmins(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAdmins = this.admins.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedAdmins();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.admins.sort((a, b) => {
      let aValue = a[field as keyof Admin];
      let bValue = b[field as keyof Admin];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to lowercase for string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Compare values
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagedAdmins();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'bi-sort-down';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  editAdmin(id: string): void {
    this.router.navigate(['/admin/detail', id]);
  }

  confirmDelete(admin: Admin): void {
    this.adminToDelete = admin;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.adminToDelete = null;
  }

  deleteAdmin(): void {
    if (!this.adminToDelete) return;

    this.isLoading = true;
    this.error = null;

    this.adminService.deleteAdmin(this.adminToDelete._id).subscribe({
      next: () => {
        // Remove the deleted admin from the list
        this.admins = this.admins.filter(
          (admin) => admin._id !== this.adminToDelete?._id
        );
        this.updatePagedAdmins();
        this.showDeleteConfirm = false;
        this.adminToDelete = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting admin:', error);
        this.error = 'Không thể xóa tài khoản admin. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }
}
