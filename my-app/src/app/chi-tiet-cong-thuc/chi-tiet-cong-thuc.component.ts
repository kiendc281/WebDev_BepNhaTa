import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { HttpClientModule } from '@angular/common/http';
import { FavoritesService } from '../services/favorites.service';
import { BreadcrumbComponent } from '../components/breadcrumb/breadcrumb.component';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';

interface IngredientPackage {
  id: string;
  name: string;
  image: string;
  price: number;
}

@Component({
  selector: 'app-chi-tiet-cong-thuc',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, BreadcrumbComponent],
  templateUrl: './chi-tiet-cong-thuc.component.html',
  styleUrls: ['./chi-tiet-cong-thuc.component.css'],
  providers: [RecipeService, ProductService],
})
export class ChiTietCongThucComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = true;
  errorMessage = '';
  selectedServingSize: string = '4';
  ingredientPackages: IngredientPackage[] = [];
  activeTab: string = 'Nguyên liệu';
  activeSection: string = 'description';
  isSaved = false;
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  };
  matchingProduct: Product | null = null;

  // Thêm biến cho công thức gợi ý
  currentRecipePage: number = 0;
  recipesPerPage: number = 3;
  suggestedRecipes: Recipe[] = [];
  visibleRecipes: Recipe[] = [];
  savedRecipes: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private favoritesService: FavoritesService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadRecipe(id);
        this.checkFavoriteStatus(id);
        this.loadSavedRecipes();
        this.loadSuggestedRecipes(id);
      }
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.updateActiveSection();
  }

  updateActiveSection() {
    const sections = [
      'description',
      'ingredients',
      'preparation',
      'steps',
      'serving',
      'tips',
    ];

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.activeSection = sectionId;
    }
  }

  isActiveSection(sectionId: string): boolean {
    return this.activeSection === sectionId;
  }

  loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        if (this.recipe && this.recipe.servingsOptions) {
          this.selectedServingSize = Object.keys(
            this.recipe.servingsOptions
          ).includes('4')
            ? '4'
            : Object.keys(this.recipe.servingsOptions)[0];
        }
        this.isLoading = false;

        // Check if there's a matching product for this recipe
        this.checkForMatchingProduct(id);
      },
      error: (error) => {
        console.error('Error loading recipe:', error);
        this.errorMessage = 'Không thể tải công thức. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  getServingSizes(): string[] {
    if (!this.recipe || !this.recipe.servingsOptions) return [];
    return Object.keys(this.recipe.servingsOptions);
  }

  onServingSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedServingSize = target.value;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getCurrentIngredients() {
    if (!this.recipe || !this.selectedServingSize) return [];
    return (
      this.recipe.servingsOptions[this.selectedServingSize]?.ingredients || []
    );
  }

  checkFavoriteStatus(recipeId: string): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return;
    }

    this.favoritesService.checkFavorite(recipeId, 'recipe').subscribe({
      next: (isFavorite) => {
        this.isSaved = isFavorite;
        console.log(`Công thức ${recipeId} đã được lưu: ${isFavorite}`);
      },
      error: (error) => {
        console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
      },
    });
  }

  toggleSaveRecipe(event?: Event, recipeId?: string): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification(
        'Vui lòng đăng nhập để sử dụng tính năng này',
        'error'
      );
      return;
    }

    // If recipeId is provided, use it, otherwise use the current recipe's ID
    const targetRecipeId = recipeId || this.recipe?._id;
    if (!targetRecipeId) {
      console.error('Không có thông tin công thức');
      return;
    }

    // Check if the recipe is already saved
    const isSaved = recipeId ? this.isRecipeSaved(recipeId) : this.isSaved;

    console.log(
      'Đang xử lý lưu công thức:',
      targetRecipeId,
      'trạng thái hiện tại:',
      isSaved
    );

    this.favoritesService
      .toggleFavorite(targetRecipeId, 'recipe', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu công thức:', response);
          if (response.success) {
            if (recipeId) {
              // If this is a suggested recipe
              if (isSaved) {
                this.savedRecipes.delete(recipeId);
              } else {
                this.savedRecipes.add(recipeId);
              }
            } else {
              // If this is the main recipe
              this.isSaved = !this.isSaved;
            }

            const recipeName = recipeId
              ? this.suggestedRecipes.find((r) => r._id === recipeId)
                  ?.recipeName
              : this.recipe?.recipeName;

            if (isSaved) {
              this.showNotification(
                `Đã xóa "${recipeName}" khỏi danh sách yêu thích`,
                'success'
              );
            } else {
              this.showNotification(
                `Đã thêm "${recipeName}" vào danh sách yêu thích`,
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

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message,
      type,
    };

    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  // Thêm các phương thức cho công thức gợi ý
  loadSuggestedRecipes(currentRecipeId: string): void {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        // Lọc bỏ công thức hiện tại
        const filteredRecipes = recipes.filter(
          (r) => r._id !== currentRecipeId
        );
        // Lấy ngẫu nhiên 6 công thức
        this.suggestedRecipes = this.getRandomRecipes(filteredRecipes, 6);
        this.updateVisibleRecipes();
      },
      error: (error) => {
        console.error('Error loading suggested recipes:', error);
      },
    });
  }

  getRandomRecipes(recipes: Recipe[], count: number): Recipe[] {
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  updateVisibleRecipes(): void {
    const start = this.currentRecipePage * this.recipesPerPage;
    this.visibleRecipes = this.suggestedRecipes.slice(
      start,
      start + this.recipesPerPage
    );
  }

  prevRecipePage(): void {
    if (this.currentRecipePage > 0) {
      this.currentRecipePage--;
      this.updateVisibleRecipes();
    }
  }

  nextRecipePage(): void {
    if (
      this.currentRecipePage <
      Math.ceil(this.suggestedRecipes.length / this.recipesPerPage) - 1
    ) {
      this.currentRecipePage++;
      this.updateVisibleRecipes();
    }
  }

  isRecipeSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  // Thêm phương thức để tải danh sách công thức đã lưu
  loadSavedRecipes(): void {
    this.favoritesService.getFavoritesWithDetails('recipe').subscribe({
      next: (favorites) => {
        this.savedRecipes.clear();
        favorites.forEach((item) => {
          if (item.targetId) {
            this.savedRecipes.add(item.targetId);
          }
        });
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách công thức yêu thích:', error);
      },
    });
  }

  // Check if there's a product matching this recipe
  checkForMatchingProduct(recipeId: string): void {
    this.productService.getProductByRecipeId(recipeId).subscribe({
      next: (product) => {
        this.matchingProduct = product;
        console.log(
          'Matching product for recipe:',
          product ? product.ingredientName : 'None found'
        );
      },
      error: (error) => {
        console.error('Error finding matching product:', error);
        this.matchingProduct = null;
      },
    });
  }
}
