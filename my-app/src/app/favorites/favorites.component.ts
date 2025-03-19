import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [DatePipe]
})
export class FavoritesComponent implements OnInit {
  // Thuộc tính
  favoriteType: 'blog' | 'recipe' | 'product' = 'blog';
  favorites: any[] = [];
  loadingFavorites = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    // Kiểm tra đăng nhập
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.router.navigate(['/dang-nhap'], { 
        queryParams: { returnUrl: '/yeu-thich' } 
      });
      return;
    }
    
    // Tải danh sách yêu thích ban đầu
    this.loadFavorites();
  }

  // Đổi loại yêu thích
  changeFavoriteType(type: 'blog' | 'recipe' | 'product'): void {
    this.favoriteType = type;
    this.loadFavorites();
  }

  // Tải danh sách yêu thích
  loadFavorites(): void {
    this.loadingFavorites = true;
    this.errorMessage = null;
    
    this.favoritesService.getFavorites(this.favoriteType).subscribe(
      (data: any[]) => {
        console.log('Loaded favorites:', data);
        // Dữ liệu đã được làm sạch từ service, chỉ cần thêm formattedDate
        this.favorites = data.map(item => ({
          ...item,
          formattedDate: this.datePipe.transform(item.createdAt, 'dd/MM/yyyy HH:mm')
        }));
        this.loadingFavorites = false;
      },
      (error: any) => {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
        this.loadingFavorites = false;
        this.favorites = [];
        this.errorMessage = 'Không thể tải dữ liệu yêu thích. Vui lòng thử lại sau.';
      }
    );
  }

  // Xóa mục yêu thích
  removeFavorite(item: any): void {
    if (confirm('Bạn có chắc muốn xóa mục này khỏi danh sách yêu thích không?')) {
      this.favoritesService.removeFromFavorites(item.targetId, this.favoriteType).subscribe(
        (response) => {
          console.log('Item removed from favorites:', response);
          if (response.success) {
            // Xóa khỏi danh sách hiển thị
            this.favorites = this.favorites.filter(fav => fav._id !== item._id);
            
            // Cập nhật localStorage để đảm bảo item không xuất hiện lại sau khi làm mới
            try {
              let removedFavorites = JSON.parse(localStorage.getItem('removedFavorites') || '{}');
              if (!removedFavorites[this.favoriteType]) {
                removedFavorites[this.favoriteType] = [];
              }
              if (!removedFavorites[this.favoriteType].includes(item.targetId)) {
                removedFavorites[this.favoriteType].push(item.targetId);
              }
              localStorage.setItem('removedFavorites', JSON.stringify(removedFavorites));
            } catch (e) {
              console.error('Lỗi khi cập nhật localStorage:', e);
            }
          } else {
            alert('Không thể xóa: ' + response.message);
          }
        },
        (error: any) => {
          console.error('Lỗi khi xóa mục yêu thích:', error);
          alert('Lỗi khi xóa mục yêu thích. Vui lòng thử lại sau.');
        }
      );
    }
  }

  // Xem chi tiết mục yêu thích
  viewFavoriteItem(favorite: any): void {
    let route = '';
    
    switch(favorite.type) {
      case 'blog':
        route = `/blog/${favorite.targetId}`;
        break;
      case 'recipe':
        route = `/cong-thuc/${favorite.targetId}`;
        break;
      case 'product':
        route = `/chi-tiet-san-pham/${favorite.targetId}`;
        break;
    }
    
    if (route) {
      this.router.navigate([route]);
    }
  }

  // Điều hướng đến trang khám phá
  navigateTo(type: string): void {
    let route = '';
    
    switch(type) {
      case 'blog':
        route = '/blog';
        break;
      case 'recipe':
        route = '/cong-thuc';
        break;
      case 'product':
        route = '/san-pham';
        break;
    }
    
    if (route) {
      this.router.navigate([route]);
    }
  }
}
