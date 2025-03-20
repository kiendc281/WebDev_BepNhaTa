import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-recipe',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css'],
})
export class RecipeComponent implements OnInit, OnDestroy {
  // Biến theo dõi sắp xếp
  sortColumn: string = '_id'; // Mặc định sắp xếp theo mã công thức
  sortDirection: 'asc' | 'desc' = 'asc'; // Mặc định sắp xếp tăng dần

  // Biến lọc
  filterCategory: string = '';
  filterRegion: string = '';
  searchQuery: string = '';

  // API recipes
  originalRecipes: Recipe[] = [];
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];

  // Trạng thái loading
  isLoading: boolean = false;
  error: string | null = null;

  // Biến phân trang
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;
  filteredCount: number = 0;

  // Biến quản lý dropdown đang mở
  openDropdown: string | null = null;

  // Quản lý các công thức được chọn
  selectedRecipeIds: string[] = [];
  allRecipesSelected: boolean = false;

  // Quản lý hành động hàng loạt
  selectedAction: string = '';

  // Biến lưu ID của timer để có thể hủy
  private hideMenuTimer: any;
  private currentActiveMenu: string | null = null;
  private boundCloseDropdownHandler: any;

  constructor(private recipeService: RecipeService, private router: Router) {}

  ngOnInit(): void {
    // Kiểm tra nếu vừa cập nhật công thức từ trang chi tiết
    const needRefresh = localStorage.getItem('recipeUpdated') === 'true';
    if (needRefresh) {
      // Xóa thông tin đã sử dụng
      localStorage.removeItem('recipeUpdated');
      // Làm mới trang để tải lại dữ liệu
      window.location.reload();
    } else {
      // Tải dữ liệu công thức bình thường
      this.loadRecipes();
    }

    // Tạo bound function một lần để tránh vấn đề với việc remove listener
    this.boundCloseDropdownHandler = this.closeDropdownOutside.bind(this);

    // Thêm event listener để đóng dropdown khi click ra ngoài
    setTimeout(() => {
      document.addEventListener('click', this.boundCloseDropdownHandler);
    }, 0);
  }

  ngOnDestroy(): void {
    // Xóa event listener khi component bị hủy
    document.removeEventListener('click', this.boundCloseDropdownHandler);

    // Xóa timers nếu có
    if (this.hideMenuTimer) {
      clearTimeout(this.hideMenuTimer);
    }
  }

  // Lấy danh sách công thức từ API
  loadRecipes(): void {
    this.isLoading = true;
    this.error = null;

    const filters = {
      category: this.filterCategory,
      region: this.filterRegion,
      search: this.searchQuery,
    };

    this.recipeService.getAllRecipes(filters).subscribe({
      next: (data) => {
        this.originalRecipes = data;
        this.recipes = [...data];
        this.totalItems = data.length;
        this.filteredCount = data.length;
        this.sortRecipes(this.sortColumn, this.sortDirection);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu công thức:', err);
        this.error = 'Không thể tải dữ liệu công thức. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  // Hàm xử lý sắp xếp khi click vào header
  sort(column: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const apiColumnMap: { [key: string]: string } = {
      recipeName: 'recipeName',
      _id: '_id',
      likes: 'likes',
      category: 'category',
      region: 'region',
    };

    const apiColumn = apiColumnMap[column] || column;

    if (this.sortColumn === apiColumn) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = apiColumn;
      this.sortDirection = 'asc';
    }

    this.sortRecipes(this.sortColumn, this.sortDirection);
  }

  // Hàm sắp xếp danh sách công thức
  sortRecipes(column: string, direction: 'asc' | 'desc'): void {
    this.recipes = [...this.recipes].sort((a, b) => {
      let valueA: any, valueB: any;

      switch (column) {
        case 'recipeName':
          valueA = a.recipeName?.toLowerCase() || '';
          valueB = b.recipeName?.toLowerCase() || '';
          break;
        case '_id':
          valueA = a._id || '';
          valueB = b._id || '';
          break;
        case 'likes':
          valueA = a.likes || 0;
          valueB = b.likes || 0;
          break;
        case 'category':
          valueA = a.category?.toLowerCase() || '';
          valueB = b.category?.toLowerCase() || '';
          break;
        case 'region':
          valueA = a.region?.toLowerCase() || '';
          valueB = b.region?.toLowerCase() || '';
          break;
        default:
          valueA = (a as any)[column] || '';
          valueB = (b as any)[column] || '';
      }

      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Hàm đóng dropdown khi click ra ngoài
  closeDropdownOutside(event: MouseEvent): void {
    // Nếu đang có dropdown mở và click không phải vào dropdown
    if (this.openDropdown) {
      const dropdownElements = document.querySelectorAll('.custom-dropdown');
      let clickedInside = false;

      dropdownElements.forEach((element) => {
        if (element.contains(event.target as Node)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        this.closeDropdown();
      }
    }
  }

  // Xử lý toggle dropdown
  toggleDropdown(dropdownName: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.openDropdown === dropdownName) {
      this.closeDropdown();
    } else {
      this.openDropdown = dropdownName;
    }
  }

  // Đóng dropdown
  closeDropdown(): void {
    this.openDropdown = null;
  }

  // Chọn danh mục
  selectCategory(category: string): void {
    this.filterCategory = category;
    this.currentPage = 1;
    this.applyFilters();
    this.closeDropdown();
  }

  // Chọn vùng miền
  selectRegion(region: string): void {
    this.filterRegion = region;
    this.currentPage = 1;
    this.applyFilters();
    this.closeDropdown();
  }

  // Chọn tất cả công thức
  toggleAllRecipes(): void {
    this.allRecipesSelected = !this.allRecipesSelected;

    if (this.allRecipesSelected) {
      // Chọn tất cả công thức trên trang hiện tại
      this.selectedRecipeIds = this.getPaginatedRecipes()
        .map((recipe) => recipe._id || '')
        .filter((id) => id !== '');
    } else {
      // Bỏ chọn tất cả
      this.selectedRecipeIds = [];
    }
  }

  // Chọn/bỏ chọn một công thức
  toggleRecipeSelection(recipeId: string): void {
    const index = this.selectedRecipeIds.indexOf(recipeId);

    if (index === -1) {
      // Nếu chưa chọn thì thêm vào
      this.selectedRecipeIds.push(recipeId);
    } else {
      // Nếu đã chọn thì xóa đi
      this.selectedRecipeIds.splice(index, 1);
    }

    // Cập nhật trạng thái "chọn tất cả"
    this.updateAllSelectedStatus();
  }

  // Cập nhật trạng thái "chọn tất cả"
  updateAllSelectedStatus(): void {
    const currentPageRecipes = this.getPaginatedRecipes();
    const currentPageIds = currentPageRecipes
      .map((recipe) => recipe._id || '')
      .filter((id) => id !== '');

    // Kiểm tra xem tất cả công thức trên trang hiện tại có được chọn không
    this.allRecipesSelected =
      currentPageIds.every((id) => this.selectedRecipeIds.includes(id)) &&
      currentPageIds.length > 0;
  }

  // Lấy công thức đã phân trang
  getPaginatedRecipes(): Recipe[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.recipes.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Kiểm tra có công thức nào được chọn không
  get hasSelectedRecipes(): boolean {
    return this.selectedRecipeIds.length > 0;
  }

  // Tính tổng số trang
  getTotalPages(): number {
    return Math.ceil(this.filteredCount / this.itemsPerPage);
  }

  // Helper method để tạo mảng số trang
  getPageArray(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  // Chuyển đến trang trước
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Chuyển đến trang tiếp theo
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  // Lựa chọn hành động hàng loạt
  selectAction(action: string): void {
    this.selectedAction = action;
  }

  // Lấy tên hiển thị của hành động
  getActionName(action: string): string {
    switch (action) {
      case 'delete':
        return 'Xóa công thức';
      default:
        return 'Hành động hàng loạt';
    }
  }

  // Áp dụng hành động hàng loạt
  applyBatchAction(): void {
    if (this.selectedAction === 'delete' && this.selectedRecipeIds.length > 0) {
      if (
        confirm(
          `Bạn có chắc chắn muốn xóa ${this.selectedRecipeIds.length} công thức đã chọn?`
        )
      ) {
        this.isLoading = true;

        // Tạo mảng các promise xóa
        const deletePromises = this.selectedRecipeIds.map((id) =>
          this.recipeService.deleteRecipe(id).toPromise()
        );

        // Xử lý tất cả các promise
        Promise.all(deletePromises)
          .then(() => {
            alert('Xóa công thức thành công!');
            this.selectedRecipeIds = [];
            this.loadRecipes();
          })
          .catch((error) => {
            console.error('Lỗi khi xóa công thức:', error);
            alert('Có lỗi xảy ra khi xóa công thức. Vui lòng thử lại sau.');
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    }
  }

  // Xóa một công thức
  deleteRecipe(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
      this.isLoading = true;

      this.recipeService.deleteRecipe(id).subscribe({
        next: () => {
          alert('Xóa công thức thành công!');
          this.loadRecipes();
        },
        error: (error) => {
          console.error('Lỗi khi xóa công thức:', error);
          alert('Không thể xóa công thức. Vui lòng thử lại sau.');
          this.isLoading = false;
        },
      });
    }
  }

  // Tìm kiếm công thức
  searchRecipes(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  // Đếm số lượng công thức theo category
  getRecipeCountByCategory(category: string): number {
    if (!this.originalRecipes || this.originalRecipes.length === 0) {
      return 0;
    }

    return this.originalRecipes.filter((recipe) => recipe.category === category)
      .length;
  }

  // Đếm số công thức theo vùng miền
  getRecipeCountByRegion(region: string): number {
    if (!this.originalRecipes || this.originalRecipes.length === 0) {
      return 0;
    }

    // Chuyển "Miền Bắc" sang "Bắc" để đối chiếu với dữ liệu
    const shortRegion = region.replace('Miền ', '');

    return this.originalRecipes.filter(
      (recipe) => recipe.region === shortRegion
    ).length;
  }

  // Lọc công thức theo danh mục và vùng miền
  applyFilters(): void {
    let filteredRecipes = [...this.originalRecipes];

    if (this.filterCategory) {
      // Chỉ lấy tên danh mục, bỏ chữ "Món " ở đầu trong một số trường hợp
      const normalizedCategory = this.filterCategory.toLowerCase();
      const categoryWithoutPrefix = this.filterCategory
        .replace('Món ', '')
        .toLowerCase();

      filteredRecipes = filteredRecipes.filter((recipe) => {
        if (!recipe.category) return false;

        // Kiểm tra cả trường hợp category là "Món mặn" hoặc chỉ là "Mặn"
        const recipeCategory = recipe.category.toLowerCase();

        return (
          recipeCategory === normalizedCategory ||
          recipeCategory === categoryWithoutPrefix ||
          `món ${recipeCategory}` === normalizedCategory
        );
      });
    }

    if (this.filterRegion) {
      filteredRecipes = filteredRecipes.filter(
        (recipe) => recipe.region === this.filterRegion
      );
    }

    this.recipes = filteredRecipes;
    this.totalItems = this.recipes.length;

    // Reset về trang đầu khi lọc
    this.currentPage = 1;
  }

  // Hiển thị danh mục đúng định dạng
  displayCategory(category: string | undefined): string {
    if (!category) return '';

    // Kiểm tra xem category đã có prefix "Món" chưa
    if (category.toLowerCase().startsWith('món ')) {
      return category; // Giữ nguyên nếu đã có prefix
    } else {
      return 'Món ' + category; // Thêm prefix nếu chưa có
    }
  }
}
