import { Component, OnInit } from '@angular/core';
import { FavoritesService } from '../services/favorites.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BreadcrumbComponent } from '../components/breadcrumb/breadcrumb.component';

// Định nghĩa các interface cho dữ liệu
interface ProductDetails {
  ingredientName?: string;
  image?: string;
  mainImage?: string;
  description?: string;
  price?: number;
  discount?: number;
  category?: string;
  level?: string;
  time?: string;
  [key: string]: any;
}

interface RecipeDetails {
  recipeName?: string;
  recipeImage?: string;
  title?: string;
  thumbnail?: string;
  description?: string;
  cookingTime?: string;
  time?: string;
  difficulty?: string;
  servingsOptions?: {
    serves?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface BlogDetails {
  title?: string;
  thumbnail?: string;
  description?: string;
  category?: string;
  author?: string;
  date?: string;
  [key: string]: any;
}

interface FavoriteItem {
  _id: string;
  accountId: string;
  targetId: string;
  type: 'product' | 'recipe' | 'blog';
  createdAt: string;
  details?: ProductDetails | RecipeDetails | BlogDetails;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit {
  favorites: FavoriteItem[] = [];
  activeTab: string = 'product'; // Default tab
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadFavorites(this.activeTab);
  }

  // Chọn tab và load dữ liệu tương ứng
  selectTab(tab: string): void {
    this.activeTab = tab;
    this.loadFavorites(tab);
  }

  // Phương pháp mới - Lấy danh sách yêu thích với chi tiết từ API
  loadFavorites(type: string): void {
    this.loading = true;
    this.error = null;
    this.favorites = []; // Xóa dữ liệu cũ để tránh hiển thị sai

    console.log('Đang tải danh sách yêu thích cho loại:', type);

    // Sử dụng API mới để lấy dữ liệu với chi tiết đầy đủ
    this.favoritesService.getFavoritesWithDetails(type).subscribe({
      next: (data) => {
        console.log(
          `Đã nhận ${data.length} mục yêu thích ${type} với chi tiết:`,
          data
        );
        this.favorites = data as FavoriteItem[];

        // Nếu không có dữ liệu chi tiết đủ, có thể thực hiện bổ sung thêm
        if (data.length > 0 && data.some((item) => !item.details)) {
          console.log('Có dữ liệu thiếu chi tiết, bổ sung thêm thông tin');
          this.enrichMissingDetails(data as FavoriteItem[], type);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách yêu thích:', err);
        this.error = 'Không thể tải danh sách yêu thích. Vui lòng thử lại sau.';
        this.loading = false;
      },
    });
  }

  // Bổ sung thông tin nếu cần
  enrichMissingDetails(favorites: FavoriteItem[], type: string): void {
    // Lọc ra các mục thiếu thông tin chi tiết
    const missingDetailsItems = favorites.filter((item) => !item.details);

    if (missingDetailsItems.length === 0) {
      this.loading = false;
      return;
    }

    console.log(
      `Cần bổ sung chi tiết cho ${missingDetailsItems.length} mục ${type}`
    );

    // Tạo các request bổ sung thông tin
    const requests = missingDetailsItems.map((item) => {
      let apiUrl = '';
      let targetId = item.targetId;

      // Xử lý đặc biệt cho blog với ID MongoDB
      if (type === 'blog' && /^[0-9a-fA-F]{24}$/.test(item.targetId)) {
        // Cố gắng chuyển đổi thành ID ngắn (BL01, BL02, ...)
        const mongoIdMap: { [key: string]: string } = {
          '507f1f77bcf86cd799439011': 'BL01',
          '507f1f77bcf86cd799439012': 'BL02',
          '507f1f77bcf86cd799439013': 'BL03',
          '507f1f77bcf86cd799439014': 'BL04',
          '507f1f77bcf86cd799439015': 'BL05',
        };

        if (mongoIdMap[item.targetId]) {
          targetId = mongoIdMap[item.targetId];
          console.log(
            `Chuyển đổi MongoDB ID ${item.targetId} sang ID ngắn ${targetId} cho API call`
          );
        }
      }

      // Xác định đúng endpoint API dựa vào loại
      if (type === 'product') {
        apiUrl = `http://localhost:3000/api/ingredients/${targetId}`;
      } else if (type === 'recipe') {
        // Đối với công thức, sử dụng chính xác API endpoint
        apiUrl = `http://localhost:3000/api/recipes/${targetId}`;
        console.log('Tạo request chi tiết công thức:', apiUrl);
      } else if (type === 'blog') {
        apiUrl = `http://localhost:3000/api/blogs/${targetId}`;
        console.log('Tạo request chi tiết bài viết:', apiUrl);
      }

      return this.http.get(apiUrl).pipe(
        catchError((err) => {
          console.error(
            `Lỗi khi lấy chi tiết cho ${type} ID ${targetId}:`,
            err
          );
          // Trả về đối tượng mặc định khi lỗi
          if (type === 'product') {
            return of<ProductDetails>({
              ingredientName: `Sản phẩm ${targetId}`,
              image:
                'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18c0f0ef89a%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18c0f0ef89a%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%22107.2%22%3EHình%20ảnh%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              description: 'Không có mô tả',
            });
          } else if (type === 'recipe') {
            return of<RecipeDetails>({
              recipeName: `Công thức ${targetId}`,
              recipeImage:
                'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18c0f0ef89a%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18c0f0ef89a%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%22107.2%22%3EHình%20ảnh%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              description: 'Không có mô tả',
              // Đối với frontend, thay đổi tên trường để phù hợp
              title: `Công thức ${targetId}`,
              thumbnail:
                'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18c0f0ef89a%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18c0f0ef89a%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%22107.2%22%3EHình%20ảnh%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
            });
          } else {
            // Cho blog, luôn trả về placeholder khi lỗi dù ID có định dạng nào
            return of<BlogDetails>({
              title: `Bài viết ${targetId}`,
              thumbnail:
                'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18c0f0ef89a%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A15pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18c0f0ef89a%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23EEEEEE%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22110.0859375%22%20y%3D%22107.2%22%3EHình%20ảnh%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E',
              description: 'Không có mô tả',
              author: 'Bếp Nhà Ta',
            });
          }
        })
      );
    });

    // Thực hiện tất cả các request cùng lúc
    forkJoin(requests)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((results) => {
        // Cập nhật chi tiết cho các mục thiếu thông tin
        results.forEach((result, index) => {
          const targetId = missingDetailsItems[index].targetId;
          const favoriteIndex = this.favorites.findIndex(
            (f) => f.targetId === targetId
          );

          if (favoriteIndex >= 0) {
            // Xử lý kết quả đặc biệt cho từng loại
            if (type === 'recipe') {
              // Chuyển đổi tên trường từ API sang frontend
              const recipeResult = result as RecipeDetails;
              const processedResult = {
                ...recipeResult,
                title: recipeResult.recipeName || recipeResult.title,
                thumbnail: recipeResult.recipeImage || recipeResult.thumbnail,
              };
              this.favorites[favoriteIndex].details = processedResult;
            } else if (type === 'blog') {
              // Đảm bảo trường author luôn là chuỗi
              const blogResult = result as BlogDetails;
              const processedResult = {
                ...blogResult,
                author:
                  typeof blogResult.author === 'object'
                    ? 'Bếp Nhà Ta'
                    : blogResult.author || 'Bếp Nhà Ta',
              };
              this.favorites[favoriteIndex].details = processedResult;
            } else {
              this.favorites[favoriteIndex].details = result;
            }
            console.log(
              `Đã cập nhật chi tiết cho ${type} ID ${targetId}:`,
              this.favorites[favoriteIndex].details
            );
          }
        });
      });
  }

  // Tính giá sau khi giảm giá
  calculateDiscountPrice(product: ProductDetails | undefined): number {
    if (!product || !product.price) {
      return 0;
    }

    const price =
      typeof product.price === 'string'
        ? parseFloat(product.price)
        : product.price;
    if (isNaN(price)) {
      return 0;
    }

    if (product.discount && product.discount > 0) {
      const discount =
        typeof product.discount === 'string'
          ? parseFloat(product.discount)
          : product.discount;
      if (!isNaN(discount)) {
        return price * (1 - discount / 100);
      }
    }

    return price;
  }

  // Xóa khỏi danh sách yêu thích
  removeFromFavorites(favorite: FavoriteItem): void {
    if (
      confirm('Bạn có chắc chắn muốn xóa mục này khỏi danh sách yêu thích?')
    ) {
      this.favoritesService
        .removeFromFavorites(favorite.targetId, favorite.type)
        .subscribe({
          next: (response) => {
            console.log('Kết quả xóa khỏi yêu thích:', response);
            if (response.success) {
              // Xóa khỏi mảng favorites
              this.favorites = this.favorites.filter(
                (f) =>
                  !(
                    f.targetId === favorite.targetId && f.type === favorite.type
                  )
              );
            } else {
              alert(
                response.message || 'Không thể xóa khỏi danh sách yêu thích.'
              );
            }
          },
          error: (err) => {
            console.error('Lỗi khi xóa khỏi yêu thích:', err);
            alert(
              'Đã xảy ra lỗi khi xóa khỏi danh sách yêu thích. Vui lòng thử lại sau.'
            );
          },
        });
    }
  }

  // Kiểm tra xem ID có phải định dạng ObjectId (24 ký tự hex) hay không
  isObjectIdFormat(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }
}
