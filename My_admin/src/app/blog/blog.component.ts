import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Blog } from '../models/blog.interface';
import { BlogService } from '../services/blog.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class BlogComponent implements OnInit {
  blogs: Blog[] = [];
  paginatedBlogs: Blog[] = []; // Blog hiển thị trên trang hiện tại
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;
  totalPages = 1;
  isLoading = false;
  error: string | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private blogService: BlogService, private router: Router) {}

  ngOnInit(): void {
    // Khôi phục tùy chọn số mục trên trang từ localStorage
    try {
      const savedPageSize = localStorage.getItem('blogItemsPerPage');
      if (savedPageSize) {
        this.itemsPerPage = parseInt(savedPageSize, 10);
        console.log('Đã khôi phục số mục trên trang:', this.itemsPerPage);
      }
    } catch (e) {
      console.error('Không thể đọc số mục trên trang từ localStorage', e);
    }

    this.loadBlogs();
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.error = null;
    this.blogService.getBlogs().subscribe(
      (data) => {
        this.blogs = data;
        this.totalItems = data.length;
        this.sortBlogs(this.sortColumn); // Apply current sorting
        this.calculateTotalPages();
        this.updatePaginatedBlogs();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading blogs:', error);
        this.error = 'Không thể tải danh sách blog. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    );
  }

  getAuthorName(author: any): string {
    if (!author) return 'Không xác định';
    if (typeof author === 'string') return author;
    return author.name || author._id || 'Không xác định';
  }

  getDisplayDate(blog: Blog): string {
    return blog.publishDate || blog.createdAt || 'Chưa cập nhật';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Chưa cập nhật';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updatePaginatedBlogs();
  }

  updatePaginatedBlogs(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);
    this.paginatedBlogs = this.blogs.slice(startIndex, endIndex);
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.totalPages === 0) {
      this.totalPages = 1;
    }
    // Đảm bảo currentPage không vượt quá totalPages
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  onPageSizeChange(): void {
    this.calculateTotalPages();
    this.currentPage = 1; // Reset về trang đầu tiên khi thay đổi số mục trên trang
    this.updatePaginatedBlogs();

    // Lưu trữ tùy chọn số mục hiển thị vào localStorage
    try {
      localStorage.setItem('blogItemsPerPage', this.itemsPerPage.toString());
      console.log('Đã lưu số mục trên trang:', this.itemsPerPage);
    } catch (e) {
      console.error('Không thể lưu số mục trên trang vào localStorage', e);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];

    // Hiển thị tối đa 5 số trang
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      // Nếu tổng số trang ≤ 5, hiển thị tất cả
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Nếu tổng số trang > 5, tính toán dải số trang hiển thị
      let startPage = Math.max(
        1,
        this.currentPage - Math.floor(maxPagesToShow / 2)
      );
      let endPage = startPage + maxPagesToShow - 1;

      if (endPage > this.totalPages) {
        // Điều chỉnh nếu vượt quá tổng số trang
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  viewBlog(blogId: string): void {
    this.router.navigate(['/blog/detail', blogId]);
  }

  editBlog(blogId: string): void {
    this.router.navigate(['/blog/edit', blogId]);
  }

  deleteBlog(blogId: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa blog này?')) {
      this.blogService.deleteBlog(blogId).subscribe(
        () => {
          this.blogs = this.blogs.filter((blog) => blog._id !== blogId);
          this.totalItems = this.blogs.length;
          this.calculateTotalPages();
          this.updatePaginatedBlogs();
        },
        (error) => {
          console.error('Error deleting blog:', error);
        }
      );
    }
  }

  sortBlogs(column: string): void {
    // If clicking the same column, toggle direction
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Sort blogs based on the selected column
    this.blogs.sort((a, b) => {
      let comparison = 0;
      const direction = this.sortDirection === 'asc' ? 1 : -1;

      switch (column) {
        case 'index':
          // Index is determined by position in array, no need to sort
          return 0;
        case '_id':
          comparison = a._id.localeCompare(b._id);
          break;
        case 'title':
          comparison = a.title
            .toLowerCase()
            .localeCompare(b.title.toLowerCase());
          break;
        case 'author':
          const authorA = this.getAuthorName(a.author).toLowerCase();
          const authorB = this.getAuthorName(b.author).toLowerCase();
          comparison = authorA.localeCompare(authorB);
          break;
        case 'date':
          const dateA = new Date(a.publishDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishDate || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'views':
          comparison = a.views - b.views;
          break;
        default:
          return 0;
      }

      return comparison * direction;
    });

    this.updatePaginatedBlogs(); // Cập nhật lại danh sách blog hiển thị sau khi sắp xếp
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi bi-filter'; // Default unsorted icon
    }
    return this.sortDirection === 'asc'
      ? 'bi bi-sort-down-alt'
      : 'bi bi-sort-up';
  }

  // Pagination methods
  previousPage(): void {
    this.onPageChange(this.currentPage - 1);
  }

  nextPage(): void {
    this.onPageChange(this.currentPage + 1);
  }

  goToPage(page: number): void {
    this.onPageChange(page);
  }
}
