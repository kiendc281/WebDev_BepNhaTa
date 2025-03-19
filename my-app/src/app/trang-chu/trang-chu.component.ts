import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { FavoritesService } from '../services/favorites.service';

@Component({
  selector: 'app-trang-chu',
  templateUrl: './trang-chu.component.html',
  styleUrls: ['./trang-chu.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class TrangChuComponent implements OnInit, OnDestroy {
  bannerImages = [
    'assets/trang-chu/banner1.png',
    'assets/trang-chu/banner2.png',
    'assets/trang-chu/banner3.jpg',
  ];
  currentBannerSlide = 0;
  private slideInterval: any;
  private readonly slideDelay = 5000; // 5 seconds
  private isAnimating = false;

  // Hot Products
  hotProducts: Product[] = [];
  currentHotProductPage = 0;
  productsPerPage = 3;
  loading = true;

  trendingRecipes: Recipe[] = [];
  currentTrendingRecipePage = 0;
  recipesPerPage = 3;
  isLoadingRecipes = false;
  savedRecipes: Set<string> = new Set();
  savedProducts: Set<string> = new Set();

  constructor(
    private router: Router,
    private productService: ProductService,
    private recipeService: RecipeService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit() {
    this.startSlideTimer();
    this.loadHotProducts();
    this.loadTrendingRecipes();
  }

  ngOnDestroy() {
    this.stopSlideTimer();
  }

  startSlideTimer() {
    this.slideInterval = setInterval(() => {
      this.nextBannerSlide();
    }, this.slideDelay);
  }

  stopSlideTimer() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  nextBannerSlide() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();

    const nextSlide = (this.currentBannerSlide + 1) % this.bannerImages.length;
    this.currentBannerSlide = nextSlide;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  prevBannerSlide() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();

    const prevSlide =
      (this.currentBannerSlide - 1 + this.bannerImages.length) %
      this.bannerImages.length;
    this.currentBannerSlide = prevSlide;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  setCurrentBannerSlide(index: number) {
    if (index === this.currentBannerSlide || this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();
    this.currentBannerSlide = index;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  navigateToCategory(category: string) {
    this.router.navigate(['/san-pham'], {
      queryParams: { category: category },
    });
  }

  navigateToProducts() {
    this.router.navigate(['/san-pham']);
  }

  navigateToRecipes() {
    this.router.navigate(['/cong-thuc']);
  }

  navigateToBlog() {
    this.router.navigate(['/blog']);
  }

  loadHotProducts() {
    this.loading = true;
    this.productService.getHotProducts().subscribe({
      next: (products) => {
        this.hotProducts = products;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading hot products:', err);
        this.loading = false;
      },
    });
  }

  get currentHotProducts(): Product[] {
    const start = this.currentHotProductPage * this.productsPerPage;
    return this.hotProducts.slice(start, start + this.productsPerPage);
  }

  nextHotProductsPage() {
    if (
      (this.currentHotProductPage + 1) * this.productsPerPage <
      this.hotProducts.length
    ) {
      this.currentHotProductPage++;
    }
  }

  previousHotProductsPage() {
    if (this.currentHotProductPage > 0) {
      this.currentHotProductPage--;
    }
  }

  goToHotProductPage(index: number) {
    if (index >= 0 && index * this.productsPerPage < this.hotProducts.length) {
      this.currentHotProductPage = index;
    }
  }

  hasDiscount(product: Product): boolean {
    return product?.discount !== undefined && product.discount > 0;
  }

  getOriginalPrice(product: Product): number {
    if (!product?.pricePerPortion) return 0;
    return product.pricePerPortion['2'] || 0;
  }

  getDiscountedPrice(product: Product): number {
    const originalPrice = this.getOriginalPrice(product);
    if (!product?.discount || product.discount <= 0) {
      return originalPrice;
    }
    return Math.round(originalPrice * (1 - product.discount / 100));
  }

  navigateToProductDetail(productId: string) {
    this.router.navigate(['/chi-tiet-san-pham', productId]);
  }

  // Trending Recipes Methods
  loadTrendingRecipes() {
    this.isLoadingRecipes = true;
    this.recipeService.getTrendingRecipes().subscribe({
      next: (recipes: Recipe[]) => {
        this.trendingRecipes = recipes;
        this.isLoadingRecipes = false;
      },
      error: (error: Error) => {
        console.error('Error loading trending recipes:', error);
        this.isLoadingRecipes = false;
      },
    });
  }

  get currentTrendingRecipes(): Recipe[] {
    const start = this.currentTrendingRecipePage * this.recipesPerPage;
    return this.trendingRecipes.slice(start, start + this.recipesPerPage);
  }

  get totalTrendingPages(): number {
    return Math.ceil(this.trendingRecipes.length / this.recipesPerPage);
  }

  nextTrendingPage(): void {
    if (this.currentTrendingRecipePage < this.totalTrendingPages - 1) {
      this.currentTrendingRecipePage++;
    }
  }

  previousTrendingPage(): void {
    if (this.currentTrendingRecipePage > 0) {
      this.currentTrendingRecipePage--;
    }
  }

  goToTrendingPage(index: number): void {
    if (index >= 0 && index < this.totalTrendingPages) {
      this.currentTrendingRecipePage = index;
    }
  }

  toggleSaveRecipe(event: Event, recipeId: string): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    
    // Đảm bảo recipeId không phải undefined
    if (!recipeId) {
      console.error('ID công thức không được cung cấp');
      alert('Không thể lưu công thức này. Xin vui lòng thử lại sau.');
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Recipe ID info from trang-chu:', {
      id: recipeId,
      idType: typeof recipeId,
      idLength: recipeId.length
    });

    const isSaved = this.isRecipeSaved(recipeId);
    
    console.log('Đang lưu công thức:', recipeId, 'loại:', 'recipe', 'trạng thái hiện tại:', isSaved);
    
    this.favoritesService.toggleFavorite(recipeId, 'recipe', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu:', response);
          if (response.success) {
            if (isSaved) {
              this.savedRecipes.delete(recipeId);
              console.log(`Đã xóa công thức ${recipeId} khỏi danh sách đã lưu`);
            } else {
              this.savedRecipes.add(recipeId);
              console.log(`Đã thêm công thức ${recipeId} vào danh sách đã lưu`);
            }
          } else {
            console.error('Không thể lưu công thức:', response.message);
            alert(response.message || 'Không thể lưu công thức. Vui lòng đăng nhập để sử dụng tính năng này.');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu công thức:', error);
          alert('Đã xảy ra lỗi khi lưu công thức. Vui lòng thử lại sau.');
        }
      });
  }

  isRecipeSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  viewRecipeDetails(recipeId: string): void {
    this.router.navigate(['/cong-thuc', recipeId]);
  }

  getServingSize(recipe: Recipe): string {
    if (
      !recipe.servingsOptions ||
      Object.keys(recipe.servingsOptions).length === 0
    ) {
      return '2';
    }
    return Object.keys(recipe.servingsOptions)[0];
  }

  toggleSaveProduct(event: Event, productId: string): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    
    // Đảm bảo productId không phải undefined
    if (!productId) {
      console.error('ID sản phẩm không được cung cấp');
      alert('Không thể lưu sản phẩm này. Xin vui lòng thử lại sau.');
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Product ID info from trang-chu:', {
      id: productId,
      idType: typeof productId,
      idLength: productId.length
    });

    const isSaved = this.isProductSaved(productId);
    
    console.log('Đang lưu sản phẩm:', productId, 'loại:', 'product', 'trạng thái hiện tại:', isSaved);
    
    this.favoritesService.toggleFavorite(productId, 'product', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu:', response);
          if (response.success) {
            if (isSaved) {
              this.savedProducts.delete(productId);
              console.log(`Đã xóa sản phẩm ${productId} khỏi danh sách đã lưu`);
            } else {
              this.savedProducts.add(productId);
              console.log(`Đã thêm sản phẩm ${productId} vào danh sách đã lưu`);
            }
          } else {
            console.error('Không thể lưu sản phẩm:', response.message);
            alert(response.message || 'Không thể lưu sản phẩm. Vui lòng đăng nhập để sử dụng tính năng này.');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu sản phẩm:', error);
          alert('Đã xảy ra lỗi khi lưu sản phẩm. Vui lòng thử lại sau.');
        }
      });
  }

  isProductSaved(productId: string): boolean {
    return this.savedProducts.has(productId);
  }
}
