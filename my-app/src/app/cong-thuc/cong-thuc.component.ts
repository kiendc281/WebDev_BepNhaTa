import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

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

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router
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
    this.totalPages = Math.ceil(
      this.filteredRecipes.length / this.itemsPerPage
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
}
