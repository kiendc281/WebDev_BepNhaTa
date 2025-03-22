import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { FavoritesService } from '../services/favorites.service';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog.interface';

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

  // Notification
  notification: { show: boolean; message: string; type: 'success' | 'error' } =
    {
      show: false,
      message: '',
      type: 'success',
    };

  // Cooking Tips Blog Posts
  tipBlogs: BlogPost[] = [];
  currentTipPage = 0;
  tipsPerPage = 3;
  isLoadingTips = false;

  constructor(
    private router: Router,
    private productService: ProductService,
    private recipeService: RecipeService,
    private favoritesService: FavoritesService,
    private blogService: BlogService
  ) {}

  ngOnInit() {
    this.startSlideTimer();
    this.loadHotProducts();
    this.loadTrendingRecipes();
    this.loadSavedItems();
    this.loadCookingTips();
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

  toggleSaveRecipe(event: Event, recipe: any): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    // Đảm bảo recipe._id không phải undefined
    if (!recipe || !recipe._id) {
      console.error('ID công thức không được cung cấp');
      return;
    }

    const user = JSON.parse(userStr);
    const recipeId = recipe._id;

    console.log('Toggle save recipe:', recipeId);

    if (this.isRecipeSaved(recipeId)) {
      // Nếu công thức đã được lưu, xóa khỏi danh sách yêu thích
      this.favoritesService.removeFromFavorites(recipeId, 'recipe').subscribe({
        next: (response) => {
          console.log('Remove from favorites response:', response);
          this.savedRecipes.delete(recipeId);
          // Force change detection
          this.savedRecipes = new Set(this.savedRecipes);

          // Hiển thị thông báo
          this.showNotification('Đã xóa khỏi danh sách yêu thích', 'success');
        },
        error: (error) => {
          console.error('Lỗi khi xóa khỏi yêu thích:', error);
          this.showNotification('Lỗi khi xóa khỏi yêu thích', 'error');
        },
      });
    } else {
      // Nếu công thức chưa được lưu, thêm vào danh sách yêu thích
      this.favoritesService.addToFavorites(recipeId, 'recipe').subscribe({
        next: (response) => {
          console.log('Add to favorites response:', response);
          this.savedRecipes.add(recipeId);
          // Force change detection
          this.savedRecipes = new Set(this.savedRecipes);

          // Hiển thị thông báo
          this.showNotification('Đã thêm vào danh sách yêu thích', 'success');
        },
        error: (error) => {
          console.error('Lỗi khi thêm vào yêu thích:', error);
          this.showNotification('Lỗi khi thêm vào yêu thích', 'error');
        },
      });
    }
  }

  isRecipeSaved(recipeId: string): boolean {
    console.log(
      'Checking if recipe is saved:',
      recipeId,
      this.savedRecipes.has(recipeId)
    );
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

  toggleSaveProduct(event: Event, product: any): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    // Đảm bảo product._id không phải undefined
    if (!product || !product._id) {
      console.error('ID sản phẩm không được cung cấp');
      return;
    }

    const user = JSON.parse(userStr);
    const productId = product._id;

    console.log('Toggle save product:', productId);

    if (this.isProductSaved(productId)) {
      // Nếu sản phẩm đã được lưu, xóa khỏi danh sách yêu thích
      this.favoritesService
        .removeFromFavorites(productId, 'product')
        .subscribe({
          next: (response) => {
            console.log('Remove from favorites response:', response);
            this.savedProducts.delete(productId);
            // Force change detection
            this.savedProducts = new Set(this.savedProducts);

            // Hiển thị thông báo
            this.showNotification('Đã xóa khỏi danh sách yêu thích', 'success');
          },
          error: (error) => {
            console.error('Lỗi khi xóa khỏi yêu thích:', error);
            this.showNotification('Lỗi khi xóa khỏi yêu thích', 'error');
          },
        });
    } else {
      // Nếu sản phẩm chưa được lưu, thêm vào danh sách yêu thích
      this.favoritesService.addToFavorites(productId, 'product').subscribe({
        next: (response) => {
          console.log('Add to favorites response:', response);
          this.savedProducts.add(productId);
          // Force change detection
          this.savedProducts = new Set(this.savedProducts);

          // Hiển thị thông báo
          this.showNotification('Đã thêm vào danh sách yêu thích', 'success');
        },
        error: (error) => {
          console.error('Lỗi khi thêm vào yêu thích:', error);
          this.showNotification('Lỗi khi thêm vào yêu thích', 'error');
        },
      });
    }
  }

  isProductSaved(productId: string): boolean {
    console.log(
      'Checking if product is saved:',
      productId,
      this.savedProducts.has(productId)
    );
    return this.savedProducts.has(productId);
  }

  // Thêm phương thức để tải danh sách đã lưu khi khởi tạo component
  loadSavedItems() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.favoritesService.getFavorites().subscribe({
        next: (favorites: any) => {
          console.log('Favorites loaded:', favorites);

          // Khởi tạo bộ danh sách mới
          this.savedRecipes = new Set();
          this.savedProducts = new Set();

          // Xử lý mỗi mục yêu thích và phân loại theo type
          favorites.forEach((item: any) => {
            if (item.type === 'recipe') {
              this.savedRecipes.add(item.targetId);
            } else if (item.type === 'product') {
              this.savedProducts.add(item.targetId);
            }
          });

          console.log('Saved recipes:', Array.from(this.savedRecipes));
          console.log('Saved products:', Array.from(this.savedProducts));
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách yêu thích:', error);
        },
      });
    }
  }

  // Phương thức hiển thị thông báo
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

  // Cooking Tips Methods
  loadCookingTips() {
    this.isLoadingTips = true;
    this.blogService.getBlogs().subscribe({
      next: (blogs) => {
        // Lọc blog với danh mục "tips" hoặc "cooking-tips" nếu có
        this.tipBlogs = blogs
          .filter(
            (blog) =>
              blog.category?.slug === 'tips' ||
              blog.category?.slug === 'cooking-tips' ||
              blog.category?.name.toLowerCase().includes('tip')
          )
          .slice(0, 9); // Giới hạn 9 bài viết

        if (this.tipBlogs.length === 0) {
          // Nếu không có blog phù hợp, lấy 9 bài viết đầu tiên
          this.tipBlogs = blogs.slice(0, 9);
        }

        this.isLoadingTips = false;
      },
      error: (error) => {
        console.error('Error loading cooking tips:', error);
        this.isLoadingTips = false;
      },
    });
  }

  get currentTipBlogs(): BlogPost[] {
    const start = this.currentTipPage * this.tipsPerPage;
    return this.tipBlogs.slice(start, start + this.tipsPerPage);
  }

  get totalTipPages(): number {
    return Math.ceil(this.tipBlogs.length / this.tipsPerPage);
  }

  get tipDotsArray(): number[] {
    return Array(this.totalTipPages)
      .fill(0)
      .map((_, i) => i);
  }

  nextTipPage(): void {
    if (this.currentTipPage < this.totalTipPages - 1) {
      this.currentTipPage++;
    }
  }

  previousTipPage(): void {
    if (this.currentTipPage > 0) {
      this.currentTipPage--;
    }
  }

  goToTipPage(index: number): void {
    if (index >= 0 && index < this.totalTipPages) {
      this.currentTipPage = index;
    }
  }

  navigateToBlogDetail(blogId: string): void {
    this.router.navigate(['/blog', blogId]);
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getDate()} TH${date.getMonth() + 1}`;
  }
}
