import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
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
  notification: { show: boolean; message: string; type: 'success' | 'error' } =
    {
      show: false,
      message: '',
      type: 'success',
    };

  // Thêm các biến cho bộ lọc
  showFilterDropdown: boolean = false;
  ingredientsList: string[] = [];
  selectedIngredients: string[] = [];
  @ViewChild('ingredientSearch') ingredientSearch!: ElementRef;
  filteredIngredientsList: string[] = [];

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
        favorites.forEach((item) => {
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
      type,
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
          this.extractIngredients();
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
    // Bước 1: Lọc theo vùng miền
    let regionFiltered = [...this.recipes];

    if (this.selectedRegion !== 'Tất cả') {
      const regionToMatch =
        this.selectedRegion === 'Miền Bắc'
          ? 'bac'
          : this.selectedRegion === 'Miền Trung'
          ? 'trung'
          : 'nam';

      regionFiltered = this.recipes.filter((recipe) => {
        const normalizedRecipeRegion = this.removeVietnameseTones(
          recipe.region || ''
        ).toLowerCase();
        return normalizedRecipeRegion === regionToMatch;
      });
    }

    // Bước 2: Lọc theo nguyên liệu
    if (this.selectedIngredients.length > 0) {
      console.log('Đang lọc theo nguyên liệu:', this.selectedIngredients);

      this.filteredRecipes = regionFiltered.filter((recipe) => {
        // Mảng để theo dõi các nguyên liệu đã tìm thấy
        const foundIngredients = new Set<string>();

        // Phương pháp 1: Kiểm tra trong servingsOptions
        if (
          recipe.servingsOptions &&
          Object.keys(recipe.servingsOptions).length > 0
        ) {
          // Lấy bất kỳ option nào (2 người hoặc 4 người) để kiểm tra
          const servingOption = Object.keys(recipe.servingsOptions)[0];
          if (
            recipe.servingsOptions[servingOption] &&
            recipe.servingsOptions[servingOption].ingredients
          ) {
            const ingredients =
              recipe.servingsOptions[servingOption].ingredients;

            // Kiểm tra từng nguyên liệu đã chọn
            for (const selectedIng of this.selectedIngredients) {
              const found = ingredients.some(
                (ing) => ing.name.trim() === selectedIng
              );
              if (found) {
                console.log(
                  `Tìm thấy nguyên liệu ${selectedIng} trong công thức ${recipe.recipeName}`
                );
                foundIngredients.add(selectedIng);
              }
            }
          }
        }

        // Phương pháp 2: Kiểm tra trong mảng ingredients nếu có
        const anyIngredients = (recipe as any).ingredients;
        if (Array.isArray(anyIngredients) && anyIngredients.length > 0) {
          // Chuyển đổi mảng ingredients sang định dạng tên
          const ingredientNames = anyIngredients
            .map((ing) => {
              if (typeof ing === 'string') return ing.trim();
              else if (ing && ing.name) return ing.name.trim();
              return '';
            })
            .filter((name) => name !== '');

          // Kiểm tra từng nguyên liệu đã chọn
          for (const selectedIng of this.selectedIngredients) {
            if (ingredientNames.includes(selectedIng)) {
              console.log(
                `Tìm thấy nguyên liệu ${selectedIng} trong danh sách ingredients của công thức ${recipe.recipeName}`
              );
              foundIngredients.add(selectedIng);
            }
          }
        }

        // Chỉ trả về true nếu TẤT CẢ nguyên liệu đã chọn đều được tìm thấy
        const allIngredientsFound =
          foundIngredients.size === this.selectedIngredients.length;
        if (allIngredientsFound) {
          console.log(
            `Công thức ${recipe.recipeName} chứa TẤT CẢ nguyên liệu đã chọn`
          );
        }
        return allIngredientsFound;
      });
    } else {
      this.filteredRecipes = [...regionFiltered];
    }

    console.log('Kết quả lọc:', this.filteredRecipes.length, 'công thức');

    // Bước 3: Sắp xếp và phân trang
    this.sortRecipes();
    this.updatePagination();
    this.updatePaginatedRecipes();
  }

  updatePaginatedRecipes(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    console.log('Cập nhật kết quả hiển thị:', {
      totalRecipes: this.filteredRecipes.length,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      startIndex,
      endIndex,
      willShowRecipes: this.filteredRecipes.slice(startIndex, endIndex).length,
    });

    if (
      this.filteredRecipes.length > 0 &&
      this.currentPage >
        Math.ceil(this.filteredRecipes.length / this.itemsPerPage)
    ) {
      console.log('Trang hiện tại vượt quá số trang, đặt lại về trang 1');
      this.currentPage = 1;
      this.updatePaginatedRecipes();
      return;
    }

    this.paginatedRecipes = this.filteredRecipes.slice(startIndex, endIndex);
    console.log(
      'Danh sách công thức hiển thị:',
      this.paginatedRecipes.map((r) => r.recipeName)
    );
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

  // Phương thức để di chuyển đến trang cụ thể
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedRecipes();
      this.scrollToTop();
    }
  }

  // Phương thức để quay lại trang trước
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedRecipes();
      this.scrollToTop();
    }
  }

  // Phương thức để tới trang tiếp theo
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedRecipes();
      this.scrollToTop();
    }
  }

  // Phương thức để cuộn lên đầu trang
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(
      this.filteredRecipes.length / this.itemsPerPage
    );
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
      this.showNotification(
        'Vui lòng đăng nhập để sử dụng tính năng này',
        'error'
      );
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Recipe info:', {
      id: recipe._id,
      name: recipe.recipeName,
      idType: typeof recipe._id,
      idLength: recipe._id ? recipe._id.length : 'undefined',
    });

    // Đảm bảo công thức có ID trước khi thực hiện
    if (!recipe._id) {
      console.error('Công thức không có ID', recipe);
      this.showNotification(
        'Không thể lưu công thức này. Xin vui lòng thử lại sau.',
        'error'
      );
      return;
    }

    // Lấy ID của công thức
    const recipeId = recipe._id;

    // Kiểm tra xem đã lưu chưa
    const isSaved = this.isRecipeSaved(recipeId);

    console.log(
      'Đang xử lý lưu công thức:',
      recipeId,
      'trạng thái hiện tại:',
      isSaved
    );

    this.favoritesService
      .toggleFavorite(recipeId, 'recipe', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu công thức:', response);
          if (response.success) {
            if (isSaved) {
              this.savedRecipes.delete(recipeId);
              console.log(`Đã xóa công thức ${recipeId} khỏi danh sách đã lưu`);
              this.showNotification(
                `Đã xóa "${recipe.recipeName}" khỏi danh sách yêu thích`,
                'success'
              );
            } else {
              this.savedRecipes.add(recipeId);
              console.log(`Đã thêm công thức ${recipeId} vào danh sách đã lưu`);
              this.showNotification(
                `Đã thêm "${recipe.recipeName}" vào danh sách yêu thích`,
                'success'
              );
            }
          } else {
            console.error('Không thể lưu công thức:', response.message);
            this.showNotification(
              response.message ||
                'Không thể lưu công thức. Vui lòng thử lại sau.',
              'error'
            );
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu công thức:', error);
          this.showNotification(
            'Đã xảy ra lỗi khi lưu công thức. Vui lòng thử lại sau.',
            'error'
          );
        },
      });
  }

  // Kiểm tra công thức đã lưu hay chưa
  isRecipeSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  // Đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    this.closeFilterDropdown(event);
  }

  // Phương thức để đóng dropdown khi click ra ngoài
  closeFilterDropdown(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.filter-dropdown-container')) {
      this.showFilterDropdown = false;
    }
  }

  // Phương thức để xử lý hiển thị và ẩn bộ lọc
  toggleFilterDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showFilterDropdown = !this.showFilterDropdown;

    if (this.showFilterDropdown) {
      this.filteredIngredientsList = [...this.ingredientsList];
      setTimeout(() => {
        if (this.ingredientSearch) {
          this.ingredientSearch.nativeElement.focus();
        }
      }, 100);
    }
  }

  // Phương thức để lọc danh sách nguyên liệu khi gõ vào ô tìm kiếm
  searchIngredients(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredIngredientsList = this.ingredientsList.filter((ingredient) =>
      ingredient.toLowerCase().includes(searchValue)
    );
  }

  // Phương thức lấy danh sách nguyên liệu từ tất cả các công thức
  extractIngredients(): void {
    const allIngredients = new Set<string>();

    // Kiểm tra xem recipes có dữ liệu không
    if (!this.recipes || this.recipes.length === 0) {
      console.log('Không có dữ liệu công thức để trích xuất nguyên liệu');
      return;
    }

    // Log debug thông tin
    console.log(
      `Bắt đầu trích xuất nguyên liệu từ ${this.recipes.length} công thức`
    );

    // Phương pháp xử lý 1: Trích xuất từ cấu trúc servingsOptions (mẫu chuẩn)
    this.recipes.forEach((recipe, index) => {
      try {
        if (recipe && recipe.servingsOptions) {
          // Kiểm tra mục đầu tiên để xem cấu trúc
          const firstOption = Object.keys(recipe.servingsOptions)[0];
          if (firstOption) {
            console.log(`Công thức ${index}:`, recipe.recipeName);
            console.log(
              `Cấu trúc servingsOptions của công thức:`,
              JSON.stringify(recipe.servingsOptions).substring(0, 100) + '...'
            );
          }

          // Duyệt qua từng option phần ăn
          for (const option in recipe.servingsOptions) {
            if (
              recipe.servingsOptions[option] &&
              recipe.servingsOptions[option].ingredients
            ) {
              // Duyệt qua từng nguyên liệu
              recipe.servingsOptions[option].ingredients.forEach(
                (ingredient) => {
                  if (ingredient && ingredient.name) {
                    allIngredients.add(ingredient.name.trim());
                  }
                }
              );
            }
          }
        }
      } catch (err) {
        console.error(`Lỗi khi xử lý công thức ${index}:`, err);
      }
    });

    // Nếu không tìm thấy nguyên liệu nào, thử phương pháp 2
    if (allIngredients.size === 0) {
      console.log(
        'Không tìm thấy nguyên liệu nào qua phương pháp 1, thử phương pháp 2'
      );

      // Phương pháp xử lý 2: Trích xuất từ một mảng ingredients nếu có
      this.recipes.forEach((recipe, index) => {
        try {
          // Kiểm tra xem có thuộc tính ingredients không
          const anyIngredients = (recipe as any).ingredients;
          if (Array.isArray(anyIngredients)) {
            console.log(
              `Công thức ${index} có mảng ingredients:`,
              anyIngredients.length
            );
            anyIngredients.forEach((ingredient) => {
              if (typeof ingredient === 'string') {
                allIngredients.add(ingredient.trim());
              } else if (ingredient && ingredient.name) {
                allIngredients.add(ingredient.name.trim());
              }
            });
          }
        } catch (err) {
          console.error(
            `Lỗi khi xử lý công thức ${index} với phương pháp 2:`,
            err
          );
        }
      });
    }

    // Chuyển đổi Set thành mảng và sắp xếp
    this.ingredientsList = Array.from(allIngredients).sort();
    this.filteredIngredientsList = [...this.ingredientsList];

    console.log(
      `Đã trích xuất được ${this.ingredientsList.length} nguyên liệu:`,
      this.ingredientsList
    );
  }

  // Phương thức để chọn/bỏ chọn nguyên liệu
  toggleIngredient(ingredient: string): void {
    const index = this.selectedIngredients.indexOf(ingredient);
    if (index > -1) {
      this.selectedIngredients.splice(index, 1);
    } else {
      this.selectedIngredients.push(ingredient);
    }
    // Đặt lại về trang 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterRecipes();
  }

  // Phương thức để lọc theo vùng miền
  selectRegion(region: string): void {
    this.selectedRegion = region;
    // Đặt lại về trang 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterRecipes();
    this.toggleFilterDropdown();
  }

  // Phương thức để xóa tất cả bộ lọc
  clearFilters(): void {
    this.selectedRegion = 'Tất cả';
    this.selectedIngredients = [];
    // Đặt lại về trang 1 khi thay đổi bộ lọc
    this.currentPage = 1;
    this.filterRecipes();
  }
}
