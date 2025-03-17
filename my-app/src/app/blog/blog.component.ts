import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog.interface';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  providers: [BlogService]
})
export class BlogComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  filteredBlogPosts: BlogPost[] = [];
  paginatedBlogPosts: BlogPost[] = [];
  loading: boolean = true;
  error: string | null = null;
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 6; // Hiển thị 6 bài viết mỗi trang
  totalPages: number = 0;
  displayedPages: number[] = [];
  
  constructor(private blogService: BlogService) { }

  ngOnInit(): void {
    this.loadBlogPosts();
  }

  loadBlogPosts(): void {
    this.loading = true;
    this.blogService.getBlogs().subscribe({
      next: (data) => {
        this.blogPosts = data;
        this.filteredBlogPosts = [...data];
        this.loading = false;
        this.updatePagination();
        this.updatePaginatedBlogPosts();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu blog:', err);
        this.error = 'Không thể tải dữ liệu blog. Vui lòng thử lại sau.';
        this.loading = false;
        
        // Fallback to sample data in case of error
        this.loadSampleData();
      }
    });
  }

  loadSampleData(): void {
    // Sample data as fallback if API fails
    this.blogPosts = [
      {
        _id: '1',
        title: 'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi',
        category: {
          name: 'Đặc sản vùng miền',
          slug: 'dac-san-vung-mien'
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: true
      },
      {
        _id: '2',
        title: 'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-2',
        category: {
          name: 'Dinh dưỡng',
          slug: 'dinh-duong'
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false
      },
      {
        _id: '3',
        title: 'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-3',
        category: {
          name: 'Đặc sản vùng miền',
          slug: 'dac-san-vung-mien'
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false
      },
      {
        _id: '4',
        title: 'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-4',
        category: {
          name: 'Mẹo bếp núc',
          slug: 'meo-bep-nuc'
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false
      },
      {
        _id: '5',
        title: 'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-5',
        category: {
          name: 'Mẹo bếp núc',
          slug: 'meo-bep-nuc'
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com'
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description: 'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false
      }
    ];
    this.filteredBlogPosts = [...this.blogPosts];
    this.updatePagination();
    this.updatePaginatedBlogPosts();
  }

  toggleSavePost(post: BlogPost): void {
    post.saved = !post.saved;
  }

  likePost(post: BlogPost): void {
    post.likes++;
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedPages();
      this.updatePaginatedBlogPosts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedPages();
      this.updatePaginatedBlogPosts();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPages();
      this.updatePaginatedBlogPosts();
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBlogPosts.length / this.itemsPerPage);
    this.updateDisplayedPages();
  }

  private updateDisplayedPages(): void {
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = start + maxPages - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxPages + 1);
    }

    this.displayedPages = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  }

  private updatePaginatedBlogPosts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBlogPosts = this.filteredBlogPosts.slice(startIndex, endIndex);
  }
}
