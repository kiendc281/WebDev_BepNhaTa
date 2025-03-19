import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Blog } from '../models/blog.interface';
import { BlogService } from '../services/blog.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class BlogComponent implements OnInit {
  blogs: Blog[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  isLoading = false;
  error: string | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private blogService: BlogService, private router: Router) {}

  ngOnInit(): void {
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
    this.currentPage = page;
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
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi bi-arrow-down-up'; // Default unsorted icon
    }
    return this.sortDirection === 'asc'
      ? 'bi bi-sort-down-alt'
      : 'bi bi-sort-up';
  }
}
