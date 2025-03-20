import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { Blog } from '../models/blog.interface';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    const blogId = this.route.snapshot.paramMap.get('id');
    if (blogId) {
      this.loadBlog(blogId);
    } else {
      this.errorMessage = 'Không tìm thấy ID blog';
      this.router.navigate(['/blog']);
    }
  }

  private loadBlog(blogId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.blogService.getBlogById(blogId).subscribe(
      (blog) => {
        this.blog = blog;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading blog:', error);
        this.errorMessage =
          'Không thể tải thông tin blog. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  editBlog(): void {
    if (this.blog) {
      this.router.navigate(['/blog/edit', this.blog._id]);
    }
  }

  getAuthorName(author: any): string {
    if (!author) return 'Không xác định';
    if (typeof author === 'string') return author;
    return author.name || author._id || 'Không xác định';
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
}
