import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog.interface';
import { HttpClientModule } from '@angular/common/http';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  providers: [BlogService, FavoritesService]
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
  
  // Property for notification
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  };
  
  constructor(private blogService: BlogService, private favoritesService: FavoritesService) { }

  ngOnInit(): void {
    this.loadBlogPosts();
    this.checkSavedPosts();
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
        this.checkSavedPosts();
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
        saved: false
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
    this.checkSavedPosts();
  }

  toggleSavePost(post: BlogPost): void {
    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
    }

    // Lưu trữ bản sao an toàn của tiêu đề bài viết (tránh tham chiếu đến object)
    const postTitle = post.title || 'Bài viết';

    // Gọi FavoritesService để toggle trạng thái lưu
    this.favoritesService.toggleFavorite(post._id, 'blog', post.saved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu bài viết:', response);
          if (response.success) {
            post.saved = !post.saved;
            
            // Cập nhật trạng thái trong localStorage cho đồng bộ
            try {
              const savedPosts = JSON.parse(localStorage.getItem('savedBlogPosts') || '[]');
              if (post.saved && !savedPosts.includes(post._id)) {
                savedPosts.push(post._id);
              } else if (!post.saved && savedPosts.includes(post._id)) {
                const index = savedPosts.indexOf(post._id);
                if (index > -1) {
                  savedPosts.splice(index, 1);
                }
              }
              localStorage.setItem('savedBlogPosts', JSON.stringify(savedPosts));
            } catch (error) {
              console.error('Lỗi khi cập nhật localStorage:', error);
            }
            
            this.showNotification(
              post.saved ? `Đã lưu bài viết "${postTitle}"` : `Đã bỏ lưu bài viết "${postTitle}"`, 
              'success'
            );
          } else {
            console.error('Không thể lưu bài viết:', response.message);
            this.showNotification(response.message || 'Không thể lưu bài viết. Vui lòng thử lại sau.', 'error');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu bài viết:', error);
          this.showNotification('Đã xảy ra lỗi khi lưu bài viết. Vui lòng thử lại sau.', 'error');
        }
      });
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

  // Hiển thị thông báo
  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message,
      type
    };

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      this.notification = {
        ...this.notification,
        show: false
      };
    }, 3000);
  }

  // Kiểm tra danh sách bài viết đã lưu
  checkSavedPosts(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return;
    }

    try {
      // Lấy danh sách bài viết đã lưu từ localStorage
      const savedPosts = JSON.parse(localStorage.getItem('savedBlogPosts') || '[]');
      
      // Cập nhật trạng thái saved cho tất cả các bài viết
      this.blogPosts.forEach(post => {
        post.saved = savedPosts.includes(post._id);
      });
      
      // Cập nhật trạng thái cho các bài viết đã được lọc
      this.filteredBlogPosts.forEach(post => {
        post.saved = savedPosts.includes(post._id);
      });
      
      // Cập nhật trạng thái cho các bài viết đang hiển thị
      this.paginatedBlogPosts.forEach(post => {
        post.saved = savedPosts.includes(post._id);
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra bài viết đã lưu:', error);
    }
  }
}
