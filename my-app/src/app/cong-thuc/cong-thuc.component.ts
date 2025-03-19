import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-cong-thuc',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './cong-thuc.component.html',
  styleUrls: ['./cong-thuc.component.css'],
  providers: [RecipeService],
})
export class CongThucComponent implements OnInit {
  recipes: Recipe[] = [];
  originalRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  paginatedRecipes: Recipe[] = [];
  regions: string[] = ['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];
  selectedRegion: string = 'Tất cả';
  isLoading: boolean = false;
  errorMessage: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9; // Hiển thị 9 công thức mỗi trang
  totalPages: number = 0;
  displayedPages: number[] = [];
  sortOptions = [
    { value: 'default', label: 'Mặc định' },
    { value: 'name-asc', label: 'Tên: A đến Z' },
    { value: 'name-desc', label: 'Tên: Z đến A' },
  ];
  selectedSort: string = 'default';
  savedRecipes: Set<string> = new Set();
  notification: { show: boolean; message: string; type: 'success' | 'error' } = {
    show: false,
    message: '',
    type: 'success'
  };

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    // Đăng ký theo dõi thay đổi params
    this.route.queryParams.subscribe((params) => {
      const region = params['region'];
      if (!region) {
        this.selectedRegion = 'Tất cả';
      } else {
        // Chuyển đổi param thành tên hiển thị
        switch (region.toLowerCase()) {
          case 'bac':
            this.selectedRegion = 'Miền Bắc';
            break;
          case 'trung':
            this.selectedRegion = 'Miền Trung';
            break;
          case 'nam':
            this.selectedRegion = 'Miền Nam';
            break;
          default:
            this.selectedRegion = 'Tất cả';
        }
      }
      this.loadRecipes();
    });
    
    // Kiểm tra danh sách công thức đã lưu
    this.checkSavedRecipes();
  }
  
  // Kiểm tra danh sách công thức đã lưu
  checkSavedRecipes(): void {
    this.favoritesService.getFavoritesWithDetails('recipe').subscribe(
      (favorites) => {
        // Xóa danh sách cũ
        this.savedRecipes.clear();
        
        // Thêm các công thức đã lưu vào Set
        favorites.forEach(item => {
          if (item.targetId) {
            this.savedRecipes.add(item.targetId);
            console.log('Đã đánh dấu công thức đã lưu:', item.targetId);
          }
        });
      },
      (error) => {
        console.error('Lỗi khi tải danh sách công thức yêu thích:', error);
      }
    );
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
      this.notification.show = false;
    }, 3000);
  }

  loadRecipes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.recipeService.getRecipes().subscribe({
      next: (data: Recipe[]) => {
        console.log('Loaded recipes:', data);
        if (Array.isArray(data)) {
          this.recipes = [...data];
          this.originalRecipes = [...data];
          this.filterRecipes();
        } else {
          console.error('Invalid data format:', data);
          this.errorMessage = 'Dữ liệu không hợp lệ';
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading recipes:', error);
        this.errorMessage = 'Không thể tải công thức. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
      complete: () => {
        console.log('Recipe loading completed');
      },
    });
  }

  filterRecipes(): void {
    if (this.selectedRegion === 'Tất cả') {
      this.filteredRecipes = [...this.recipes];
    } else {
      const regionToMatch =
        this.selectedRegion === 'Miền Bắc'
          ? 'bac'
          : this.selectedRegion === 'Miền Trung'
          ? 'trung'
          : 'nam';

      this.filteredRecipes = this.recipes.filter((recipe) => {
        const normalizedRecipeRegion = this.removeVietnameseTones(
          recipe.region || ''
        ).toLowerCase();
        return normalizedRecipeRegion === regionToMatch;
      });
    }

    this.sortRecipes();
    this.updatePagination();
    this.updatePaginatedRecipes();
  }

  updatePaginatedRecipes(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRecipes = this.filteredRecipes.slice(startIndex, endIndex);
  }

  onRegionChange(region: string): void {
    this.selectedRegion = region;
    this.currentPage = 1;

    // Cập nhật URL query parameter
    const queryParams =
      region === 'Tất cả'
        ? { region: null }
        : { region: this.getRegionParam(region) };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });

    this.filterRecipes();
  }

  // Hàm helper để chuyển đổi tên hiển thị thành param
  private getRegionParam(region: string): string {
    switch (region) {
      case 'Miền Bắc':
        return 'bac';
      case 'Miền Trung':
        return 'trung';
      case 'Miền Nam':
        return 'nam';
      default:
        return '';
    }
  }

  getSelectedSortLabel(): string {
    return (
      this.sortOptions.find((opt) => opt.value === this.selectedSort)?.label ||
      'Mặc định'
    );
  }

  selectSort(value: string): void {
    this.selectedSort = value;
    this.sortRecipes();
  }

  sortRecipes(): void {
    switch (this.selectedSort) {
      case 'name-asc':
        this.filteredRecipes.sort((a, b) =>
          this.removeVietnameseTones(a.recipeName).localeCompare(
            this.removeVietnameseTones(b.recipeName)
          )
        );
        break;
      case 'name-desc':
        this.filteredRecipes.sort((a, b) =>
          this.removeVietnameseTones(b.recipeName).localeCompare(
            this.removeVietnameseTones(a.recipeName)
          )
        );
        break;
      case 'default':
        if (this.selectedRegion === 'Tất cả') {
          this.filteredRecipes = [...this.originalRecipes];
        } else {
          const regionToMatch =
            this.selectedRegion === 'Miền Bắc'
              ? 'bac'
              : this.selectedRegion === 'Miền Trung'
              ? 'trung'
              : 'nam';

          this.filteredRecipes = this.originalRecipes.filter((recipe) => {
            const normalizedRecipeRegion = this.removeVietnameseTones(
              recipe.region || ''
            ).toLowerCase();
            return normalizedRecipeRegion === regionToMatch;
          });
        }
        break;
    }
    this.updatePaginatedRecipes();
  }

  // Thêm hàm để xử lý tiếng Việt khi sắp xếp
  private removeVietnameseTones(str: string): string {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    return str;
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('full');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }

    return stars;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedPages();
      this.updatePaginatedRecipes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedPages();
      this.updatePaginatedRecipes();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPages();
      this.updatePaginatedRecipes();
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRecipes.length / this.itemsPerPage);
    this.updateDisplayedPages();
  }

  private updateDisplayedPages(): void {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    this.displayedPages = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );
  }
  
  // Lưu công thức vào yêu thích
  toggleSaveRecipe(event: Event, recipe: Recipe): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Recipe info:', {
      id: recipe._id,
      name: recipe.recipeName,
      idType: typeof recipe._id,
      idLength: recipe._id ? recipe._id.length : 'undefined'
    });
    
    // Đảm bảo công thức có ID trước khi thực hiện
    if (!recipe._id) {
      console.error('Công thức không có ID', recipe);
      this.showNotification('Không thể lưu công thức này. Xin vui lòng thử lại sau.', 'error');
      return;
    }
    
    // Lấy ID của công thức
    const recipeId = recipe._id;
    
    // Kiểm tra xem đã lưu chưa
    const isSaved = this.isRecipeSaved(recipeId);
    
    console.log('Đang xử lý lưu công thức:', recipeId, 'trạng thái hiện tại:', isSaved);
    
    this.favoritesService.toggleFavorite(recipeId, 'recipe', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu công thức:', response);
          if (response.success) {
            if (isSaved) {
              this.savedRecipes.delete(recipeId);
              console.log(`Đã xóa công thức ${recipeId} khỏi danh sách đã lưu`);
              this.showNotification(`Đã xóa "${recipe.recipeName}" khỏi danh sách yêu thích`, 'success');
            } else {
              this.savedRecipes.add(recipeId);
              console.log(`Đã thêm công thức ${recipeId} vào danh sách đã lưu`);
              this.showNotification(`Đã thêm "${recipe.recipeName}" vào danh sách yêu thích`, 'success');
            }
          } else {
            console.error('Không thể lưu công thức:', response.message);
            this.showNotification(response.message || 'Không thể lưu công thức. Vui lòng thử lại sau.', 'error');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu công thức:', error);
          this.showNotification('Đã xảy ra lỗi khi lưu công thức. Vui lòng thử lại sau.', 'error');
        }
      });
  }

  // Kiểm tra công thức đã lưu hay chưa
  isRecipeSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }
}
