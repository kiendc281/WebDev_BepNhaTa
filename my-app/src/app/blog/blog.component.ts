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
  providers: [BlogService, FavoritesService],
})
export class BlogComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  filteredBlogPosts: BlogPost[] = [];
  paginatedBlogPosts: BlogPost[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 5; // Hiển thị 6 bài viết mỗi trang
  totalPages: number = 0;
  displayedPages: number[] = [];

  // Property for notification
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  };

  constructor(
    private blogService: BlogService,
    private favoritesService: FavoritesService
  ) {}

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
      },
    });
  }

  loadSampleData(): void {
    // Sample data as fallback if API fails
    this.blogPosts = [
      {
        _id: '507f1f77bcf86cd799439011', // MongoDB ID format
        title:
          'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi',
        category: {
          name: 'Đặc sản vùng miền',
          slug: 'dac-san-vung-mien',
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com',
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description:
          'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false,
      },
      {
        _id: '507f1f77bcf86cd799439012', // MongoDB ID format
        title:
          'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-2',
        category: {
          name: 'Dinh dưỡng',
          slug: 'dinh-duong',
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com',
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description:
          'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false,
      },
      {
        _id: '507f1f77bcf86cd799439013', // MongoDB ID format
        title:
          'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-3',
        category: {
          name: 'Đặc sản vùng miền',
          slug: 'dac-san-vung-mien',
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com',
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description:
          'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false,
      },
      {
        _id: '507f1f77bcf86cd799439014', // MongoDB ID format
        title:
          'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-4',
        category: {
          name: 'Mẹo bếp núc',
          slug: 'meo-bep-nuc',
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com',
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description:
          'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false,
      },
      {
        _id: '507f1f77bcf86cd799439015', // MongoDB ID format
        title:
          'Bắt mí bạn 5 cách chế biến cá hồi giúp nguyên định dưỡng tự nhiên',
        slug: 'bat-mi-ban-5-cach-che-bien-ca-hoi-5',
        category: {
          name: 'Mẹo bếp núc',
          slug: 'meo-bep-nuc',
        },
        author: {
          _id: 'default-author',
          name: 'Bếp Nhà Ta',
          email: 'info@bepnhata.com',
        },
        views: 1764,
        likes: 46,
        likedBy: [],
        description:
          'Cá hồi là loại thực phẩm vô cùng giàu dưỡng chất để dùng cải thiện chúng công chế chế biến thành nhiều món ngon khiến bạn giật mình thèm ăn.',
        thumbnail: 'assets/images/ca-hoi.jpg',
        publishDate: '2025-02-21T00:00:00.000Z',
        createdAt: '2025-02-21T00:00:00.000Z',
        updatedAt: '2025-02-21T00:00:00.000Z',
        saved: false,
      },
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
      this.showNotification(
        'Vui lòng đăng nhập để sử dụng tính năng này',
        'error'
      );
      return;
    }

    // Lưu trữ bản sao an toàn của tiêu đề bài viết (tránh tham chiếu đến object)
    const postTitle = post.title || 'Bài viết';

    // Cập nhật UI trước khi request để người dùng thấy phản hồi ngay lập tức
    const originalSavedState = post.saved;
    post.saved = !originalSavedState;

    // Xử lý xóa các ID trước đây trong localStorage nếu đang lưu
    if (!originalSavedState) {
      try {
        const removedFavorites = JSON.parse(
          localStorage.getItem('removedFavorites') || '{}'
        );
        if (removedFavorites['blog'] && removedFavorites['blog'].length > 0) {
          removedFavorites['blog'] = removedFavorites['blog'].filter(
            (id: string) => id !== post._id
          );
          localStorage.setItem(
            'removedFavorites',
            JSON.stringify(removedFavorites)
          );
        }
      } catch (e) {
        console.error('Lỗi khi cập nhật localStorage:', e);
      }
    }

    // Gọi FavoritesService để toggle trạng thái lưu
    this.favoritesService
      .toggleFavorite(post._id, 'blog', originalSavedState)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu bài viết:', response);
          if (response.success) {
            // Cập nhật các đối tượng liên quan
            // Cập nhật trong mảng gốc
            const postInOriginalList = this.blogPosts.find(
              (p) => p._id === post._id
            );
            if (postInOriginalList) {
              postInOriginalList.saved = post.saved;
            }

            // Cập nhật trong mảng đã lọc
            const postInFilteredList = this.filteredBlogPosts.find(
              (p) => p._id === post._id
            );
            if (postInFilteredList) {
              postInFilteredList.saved = post.saved;
            }

            // Cập nhật localStorage
            this.updateSavedPostsInLocalStorage();

            this.showNotification(
              post.saved
                ? `Đã lưu bài viết "${postTitle}"`
                : `Đã bỏ lưu bài viết "${postTitle}"`,
              'success'
            );
          } else {
            // Nếu thất bại, khôi phục trạng thái
            console.error('Không thể lưu bài viết:', response.message);
            post.saved = originalSavedState;

            // Cập nhật lại mảng
            const postInOriginalList = this.blogPosts.find(
              (p) => p._id === post._id
            );
            if (postInOriginalList) {
              postInOriginalList.saved = originalSavedState;
            }

            const postInFilteredList = this.filteredBlogPosts.find(
              (p) => p._id === post._id
            );
            if (postInFilteredList) {
              postInFilteredList.saved = originalSavedState;
            }

            // Nếu lỗi là trùng lặp, có thể không cần thông báo hoặc thông báo khác
            if (
              response.message &&
              response.message.includes('duplicate key error')
            ) {
              // Nếu đang cố thêm vào danh sách yêu thích và bị lỗi trùng lặp
              if (!originalSavedState) {
                // Đặt lại trạng thái thành "đã lưu" vì mục này thực sự đã tồn tại trong DB
                post.saved = true;
                // Cập nhật các mảng khác
                if (postInOriginalList) postInOriginalList.saved = true;
                if (postInFilteredList) postInFilteredList.saved = true;

                this.showNotification(
                  `"${postTitle}" đã có trong danh sách yêu thích của bạn`,
                  'success'
                );
                return;
              }
            }

            this.showNotification(
              response.message ||
                'Không thể lưu bài viết. Vui lòng thử lại sau.',
              'error'
            );
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu bài viết:', error);
          // Khôi phục trạng thái ban đầu nếu có lỗi
          post.saved = originalSavedState;

          // Cập nhật lại mảng
          const postInOriginalList = this.blogPosts.find(
            (p) => p._id === post._id
          );
          if (postInOriginalList) {
            postInOriginalList.saved = originalSavedState;
          }

          const postInFilteredList = this.filteredBlogPosts.find(
            (p) => p._id === post._id
          );
          if (postInFilteredList) {
            postInFilteredList.saved = originalSavedState;
          }

          // Nếu là lỗi 400 với thông báo trùng lặp (duplicate key), xử lý riêng
          if (
            error.status === 400 &&
            error.error &&
            error.error.message &&
            error.error.message.includes('duplicate key error')
          ) {
            // Nếu đang cố thêm vào danh sách yêu thích
            if (!originalSavedState) {
              // Đặt lại trạng thái thành "đã lưu" vì mục này thực sự đã tồn tại trong DB
              post.saved = true;
              // Cập nhật các mảng khác
              if (postInOriginalList) postInOriginalList.saved = true;
              if (postInFilteredList) postInFilteredList.saved = true;

              this.showNotification(
                `"${postTitle}" đã có trong danh sách yêu thích của bạn`,
                'success'
              );
              return;
            }
          }

          this.showNotification(
            'Đã xảy ra lỗi khi lưu bài viết. Vui lòng thử lại sau.',
            'error'
          );
        },
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
      this.checkSavedPosts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedPages();
      this.updatePaginatedBlogPosts();
      this.checkSavedPosts();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPages();
      this.updatePaginatedBlogPosts();
      this.checkSavedPosts();
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredBlogPosts.length / this.itemsPerPage
    );
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
    this.paginatedBlogPosts = this.filteredBlogPosts.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  // Hiển thị thông báo
  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message,
      type,
    };

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      this.notification = {
        ...this.notification,
        show: false,
      };
    }, 3000);
  }

  // Kiểm tra danh sách bài viết đã lưu
  checkSavedPosts(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('Người dùng chưa đăng nhập, không kiểm tra bài viết đã lưu');
      return;
    }

    console.log('Đang kiểm tra trạng thái lưu cho các bài viết hiển thị');

    // Trước tiên, đọc từ localStorage để có tính liên tục khi refresh
    try {
      const savedPosts = JSON.parse(
        localStorage.getItem('savedBlogPosts') || '[]'
      );
      console.log('Danh sách bài viết đã lưu từ localStorage:', savedPosts);

      // Hiển thị ngay từ localStorage trước khi API trả về
      this.blogPosts.forEach((post) => {
        post.saved = savedPosts.includes(post._id);
      });

      this.filteredBlogPosts.forEach((post) => {
        post.saved = savedPosts.includes(post._id);
      });

      this.paginatedBlogPosts.forEach((post) => {
        post.saved = savedPosts.includes(post._id);
      });
    } catch (error) {
      console.error(
        'Lỗi khi đọc danh sách bài viết đã lưu từ localStorage:',
        error
      );
    }

    // Sau đó mới gọi API để đồng bộ với server
    this.paginatedBlogPosts.forEach((post) => {
      this.favoritesService.checkFavorite(post._id, 'blog').subscribe({
        next: (isFavorite) => {
          console.log(
            `Bài viết ${post._id} - "${post.title}" - đã lưu: ${isFavorite}`
          );

          // Cập nhật trạng thái cho bài viết hiện tại
          post.saved = isFavorite;

          // Cập nhật trong mảng gốc
          const postInOriginalList = this.blogPosts.find(
            (p) => p._id === post._id
          );
          if (postInOriginalList) {
            postInOriginalList.saved = isFavorite;
          }

          // Cập nhật trong mảng đã lọc
          const postInFilteredList = this.filteredBlogPosts.find(
            (p) => p._id === post._id
          );
          if (postInFilteredList) {
            postInFilteredList.saved = isFavorite;
          }

          // Lưu lại vào localStorage
          this.updateSavedPostsInLocalStorage();
        },
        error: (error) => {
          console.error(
            `Lỗi khi kiểm tra trạng thái yêu thích cho bài viết ${post._id}:`,
            error
          );
        },
      });
    });
  }

  // Phương thức mới để cập nhật danh sách bài viết đã lưu trong localStorage
  private updateSavedPostsInLocalStorage(): void {
    try {
      const savedPostIds = this.blogPosts
        .filter((post) => post.saved)
        .map((post) => post._id);

      localStorage.setItem('savedBlogPosts', JSON.stringify(savedPostIds));
      console.log(
        'Đã cập nhật danh sách bài viết đã lưu vào localStorage:',
        savedPostIds
      );
    } catch (error) {
      console.error(
        'Lỗi khi lưu danh sách bài viết đã lưu vào localStorage:',
        error
      );
    }
  }
}
