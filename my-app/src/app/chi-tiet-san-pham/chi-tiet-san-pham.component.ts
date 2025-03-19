import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
<<<<<<< HEAD
import { Product } from '../models/product.interface';
import { CartManagerService } from '../services/cart-manager.service';
import { AuthService } from '../services/auth.service';
import { CartItem } from '../models/cart.interface';
import { Subscription } from 'rxjs';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { FavoritesService } from '../services/favorites.service';
=======
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { Product } from '../models/product.interface';
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-chi-tiet-san-pham',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chi-tiet-san-pham.component.html',
  styleUrls: ['./chi-tiet-san-pham.component.css'],
})
export class ChiTietSanPhamComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity: number = 1;
  selectedServing: string = '2';
  thumbnails: string[] = [];
  loading: boolean = true;
  error: string | null = null;
  addingToCart: boolean = false;
  cartSuccessMessage: string | null = null;

  // Lưu trữ giá hiện tại để tránh tính toán lại nhiều lần
  private _currentOriginalPrice: number = 0;
  private _currentDiscountedPrice: number = 0;

  // Properties for recipe pagination
  currentRecipePage: number = 0;
  recipesPerPage: number = 3;
  suggestedRecipes: any[] = [];
  visibleRecipes: any[] = [];

  // Properties for related/suggested products pagination
  currentProductPage: number = 0;
  productsPerPage: number = 3;
  suggestedProducts: Product[] = [];
  visibleProducts: Product[] = [];

  cartItemCount: number = 0;
  private cartSubscription: Subscription | null = null;

  faqs: FAQ[] = [
    {
      question: 'Thời gian giao hàng là bao lâu?',
      answer: 'Thời gian giao hàng từ 30-45 phút tùy khu vực.',
      isOpen: false,
    },
    {
      question: 'Có thể thay đổi số lượng người ăn không?',
      answer: 'Có, bạn có thể điều chỉnh số lượng người ăn theo nhu cầu.',
      isOpen: false,
    },
    {
      question: 'Có được đổi trả hàng không?',
      answer:
        'Chúng tôi chấp nhận đổi trả trong vòng 24h nếu sản phẩm có vấn đề.',
      isOpen: false,
    },
  ];

<<<<<<< HEAD
  savedProducts: Set<string> = new Set();
  savedRecipes: Set<string> = new Set();
  isSavedProduct = false;  // Biến theo dõi trạng thái lưu sản phẩm hiện tại
  notification = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  };

=======
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
<<<<<<< HEAD
    private cartService: CartManagerService,
    private authService: AuthService,
    private recipeService: RecipeService,
    private favoritesService: FavoritesService
=======
    private cartService: CartService,
    private authService: AuthService
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to handle navigation between related products
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.resetProductData();
        this.loadProduct(id);
        this.checkProductFavoriteStatus(id); // Kiểm tra trạng thái yêu thích của sản phẩm
      } else {
        this.error = 'Không tìm thấy mã sản phẩm';
        this.loading = false;
      }
    });

    // Generate thumbnails (temporary)
    for (let i = 0; i < 5; i++) {
      this.thumbnails.push('../../assets/san-pham/thumbnail.jpg');
    }
<<<<<<< HEAD

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe(
      (items: CartItem[]) => {
        this.cartItemCount = items.reduce(
          (count: number, item: CartItem) => count + item.quantity,
          0
        );
      }
    );
    this.updateVisibleRecipes();
    this.loadSuggestedRecipes();
    this.updateVisibleProducts();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
=======
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  }

  // Reset product data when loading a new product
  resetProductData(): void {
    this.loading = true;
    this.error = null;
    this.product = null;
    this.relatedProducts = [];
    this.quantity = 1;
    this.selectedServing = '2';
    this._currentOriginalPrice = 0;
    this._currentDiscountedPrice = 0;
    this.cartSuccessMessage = null;
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('All products:', products);
        this.product = products.find((p) => p._id === id) || null;

        if (this.product) {
          console.log('Found product:', this.product);
<<<<<<< HEAD

=======
          
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
          // Kiểm tra và log thành phần nguyên liệu
          if (this.product.components && this.product.components.length > 0) {
            console.log('Thành phần nguyên liệu:', this.product.components);
          } else {
<<<<<<< HEAD
            console.warn(
              'Không tìm thấy thành phần nguyên liệu cho sản phẩm:',
              id
            );
          }

          // Kiểm tra và log thông tin giá
          if (this.product.pricePerPortion) {
            console.log(
              'Thông tin giá theo khẩu phần:',
              this.product.pricePerPortion
            );
=======
            console.warn('Không tìm thấy thành phần nguyên liệu cho sản phẩm:', id);
          }
          
          // Kiểm tra và log thông tin giá
          if (this.product.pricePerPortion) {
            console.log('Thông tin giá theo khẩu phần:', this.product.pricePerPortion);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
          } else {
            console.warn('Không tìm thấy thông tin giá cho sản phẩm:', id);
          }

          this.loadRelatedProducts();
          this.updatePrices();
        } else {
          console.error('Không tìm thấy sản phẩm với id:', id);
          this.error = `Không tìm thấy sản phẩm với mã ${id}`;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Đã xảy ra lỗi khi tải thông tin sản phẩm';
        this.loading = false;
      },
    });
  }

  loadRelatedProducts(): void {
    if (this.product && this.product.relatedProductIds) {
      this.productService.getProducts().subscribe({
        next: (products) => {
          this.relatedProducts = products.filter((p) =>
            this.product?.relatedProductIds.includes(p._id)
          );
          console.log('Loaded related products:', this.relatedProducts);
          this.loadSuggestedProducts(products);
        },
        error: (error) => {
          console.error('Error loading related products:', error);
        },
      });
    } else {
      // Nếu không có sản phẩm liên quan, vẫn tải sản phẩm gợi ý
      this.productService.getProducts().subscribe({
        next: (products) => {
          this.loadSuggestedProducts(products);
        },
        error: (error) => {
          console.error('Error loading products:', error);
        },
      });
    }
  }

  // Method to handle related product navigation
  navigateToProduct(productId: string): void {
    this.router.navigate(['/chi-tiet-san-pham', productId]);
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Cập nhật giá hiện tại dựa trên khẩu phần đã chọn
  updatePrices(): void {
    if (!this.product) return;
<<<<<<< HEAD

    if (
      !this.product.pricePerPortion ||
      Object.keys(this.product.pricePerPortion).length === 0
    ) {
      console.error(
        'Không tìm thấy thông tin giá theo khẩu phần cho sản phẩm:',
        this.product.ingredientName
      );
=======
    
    if (!this.product.pricePerPortion || Object.keys(this.product.pricePerPortion).length === 0) {
      console.error('Không tìm thấy thông tin giá theo khẩu phần cho sản phẩm:', this.product.ingredientName);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
      this._currentOriginalPrice = 0;
      this._currentDiscountedPrice = 0;
      return;
    }
<<<<<<< HEAD

    // Kiểm tra xem khẩu phần đã chọn có giá trực tiếp không
    if (!this.product.pricePerPortion[this.selectedServing]) {
      // Nếu là khẩu phần 4 người và có giá cho 2 người, không cần thông báo lỗi vì đã xử lý ở ProductService
      if (
        !(this.selectedServing === '4' && this.product.pricePerPortion['2'])
      ) {
=======
    
    // Kiểm tra xem khẩu phần đã chọn có giá trực tiếp không
    if (!this.product.pricePerPortion[this.selectedServing]) {
      // Nếu là khẩu phần 4 người và có giá cho 2 người, không cần thông báo lỗi vì đã xử lý ở ProductService
      if (!(this.selectedServing === '4' && this.product.pricePerPortion['2'])) {
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
        // Chỉ thông báo cho các trường hợp khác
        const availablePortions = Object.keys(this.product.pricePerPortion);
        if (availablePortions.length > 0) {
          this.selectedServing = availablePortions[0];
<<<<<<< HEAD
          console.log(
            `Chuyển sang khẩu phần ${this.selectedServing} vì không tìm thấy giá cho khẩu phần đã chọn`
          );
=======
          console.log(`Chuyển sang khẩu phần ${this.selectedServing} vì không tìm thấy giá cho khẩu phần đã chọn`);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
        }
      }
    }

    // Cập nhật cả giá gốc và giá sau giảm giá
    this._currentOriginalPrice = this.productService.getPortionPrice(
      this.product,
      this.selectedServing
    );
    this._currentDiscountedPrice = this.productService.calculateDiscountedPrice(
      this.product,
      this.selectedServing
    );

    console.log(`Đã cập nhật giá cho khẩu phần ${this.selectedServing}:`, {
      original: this._currentOriginalPrice,
      discounted: this._currentDiscountedPrice,
    });
  }

  selectServing(serving: string): void {
    console.log('Đã chọn khẩu phần:', serving);
    this.selectedServing = serving;

    // Cập nhật giá ngay khi thay đổi khẩu phần
    this.updatePrices();
  }

  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }

  addToCart(): void {
    if (!this.product) return;
<<<<<<< HEAD

    this.addingToCart = true;

    // Use cart service to add product to cart
    this.cartService
      .addToCart(
        this.product,
        this.quantity,
        this.selectedServing,
        this.getDiscountedPrice()
      )
      .subscribe({
        next: (cart) => {
          console.log('Product added to cart:', {
            product: this.product?.ingredientName,
            quantity: this.quantity,
            servingSize: this.selectedServing,
            price: this.getDiscountedPrice(),
            isLoggedIn: this.authService.isLoggedIn(),
            cartItems: cart.items.length,
            totalQuantity: cart.totalQuantity,
            totalPrice: cart.totalPrice,
          });

          this.cartSuccessMessage = `Đã thêm ${this.quantity} ${this.product?.ingredientName} vào giỏ hàng`;
          this.addingToCart = false;

          // Clear success message after 3 seconds
          setTimeout(() => {
            this.cartSuccessMessage = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
          this.addingToCart = false;
          this.cartSuccessMessage =
            'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.';

          // Clear error message after 3 seconds
          setTimeout(() => {
            this.cartSuccessMessage = null;
          }, 3000);
        },
      });
=======
    
    this.addingToCart = true;
    
    // Use cart service to add product to cart
    this.cartService.addToCart(
      this.product,
      this.quantity,
      this.selectedServing,
      this.getDiscountedPrice()
    ).subscribe({
      next: (cart) => {
        console.log('Product added to cart:', {
          product: this.product?.ingredientName,
          quantity: this.quantity,
          servingSize: this.selectedServing,
          price: this.getDiscountedPrice(),
          isLoggedIn: this.authService.isLoggedIn(),
          cartItems: cart.items.length,
          totalQuantity: cart.totalQuantity,
          totalPrice: cart.totalPrice
        });
        
        this.cartSuccessMessage = `Đã thêm ${this.quantity} ${this.product?.ingredientName} vào giỏ hàng`;
        this.addingToCart = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.cartSuccessMessage = null;
        }, 3000);
      },
      error: (error) => {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        this.addingToCart = false;
        this.cartSuccessMessage = 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.';
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.cartSuccessMessage = null;
        }, 3000);
      }
    });
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  }

  addToWishlist(): void {
    if (!this.product) {
      return;
    }

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
    }

    const productId = this.product._id;
    
    console.log('Đang xử lý lưu sản phẩm:', productId, 'trạng thái hiện tại:', this.isSavedProduct);
    
    this.favoritesService.toggleFavorite(productId, 'product', this.isSavedProduct)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu sản phẩm:', response);
          if (response.success) {
            this.isSavedProduct = !this.isSavedProduct;
            if (this.isSavedProduct) {
              this.showNotification(`Đã thêm "${this.product?.ingredientName}" vào danh sách yêu thích`, 'success');
            } else {
              this.showNotification(`Đã xóa "${this.product?.ingredientName}" khỏi danh sách yêu thích`, 'success');
            }
          } else {
            console.error('Không thể lưu sản phẩm:', response.message);
            this.showNotification(response.message || 'Không thể lưu sản phẩm. Vui lòng thử lại sau.', 'error');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu sản phẩm:', error);
          this.showNotification('Đã xảy ra lỗi khi lưu sản phẩm. Vui lòng thử lại sau.', 'error');
        }
      });
  }

  buyNow(): void {
    if (!this.product) return;
<<<<<<< HEAD

    // First add to cart
    this.cartService
      .addToCart(
        this.product,
        this.quantity,
        this.selectedServing,
        this.getDiscountedPrice()
      )
      .subscribe({
        next: () => {
          // Then navigate to cart page
          this.router.navigate(['/gio-hang']);
        },
        error: (error) => {
          console.error('Error during buy now process:', error);
          this.error = 'Có lỗi xảy ra khi xử lý đơn hàng';

          // Clear error message after 3 seconds
          setTimeout(() => {
            this.error = null;
          }, 3000);
        },
      });
=======
    
    // First add to cart
    this.cartService.addToCart(
      this.product,
      this.quantity,
      this.selectedServing,
      this.getDiscountedPrice()
    ).subscribe({
      next: () => {
        // Then navigate to cart page
        this.router.navigate(['/gio-hang']);
      },
      error: (error) => {
        console.error('Error during buy now process:', error);
        this.error = 'Có lỗi xảy ra khi xử lý đơn hàng';
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.error = null;
        }, 3000);
      }
    });
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  }

  // Lấy giá gốc của sản phẩm theo khẩu phần đã chọn
  getOriginalPrice(): number {
    return this._currentOriginalPrice;
  }

  // Tính giá sau khi giảm giá
  getDiscountedPrice(): number {
    return this._currentDiscountedPrice;
  }

  // Kiểm tra xem sản phẩm có giảm giá không
  hasDiscount(): boolean {
    return this.product?.discount !== undefined && this.product.discount > 0;
  }

  // Lấy giá theo khẩu phần cho sản phẩm liên quan
  getRelatedProductPrice(product: Product): number {
    if (!product) return 0;
    return this.productService.getPortionPrice(product, '2'); // Mặc định là khẩu phần 2 người
  }

  // Lấy giá sau giảm giá cho sản phẩm liên quan
  getRelatedProductDiscountedPrice(product: Product): number {
    if (!product) return 0;
    return this.productService.calculateDiscountedPrice(product, '2'); // Mặc định là khẩu phần 2 người
  }

  // Kiểm tra xem sản phẩm liên quan có giảm giá không
  relatedProductHasDiscount(product: Product): boolean {
    return product?.discount !== undefined && product.discount > 0;
  }
  // FAQ
  visibleAnswers: { [key: string]: boolean } = {};

  toggleAnswer(questionId: string): void {
    this.visibleAnswers[questionId] = !this.visibleAnswers[questionId];
  }

  isAnswerVisible(questionId: string): boolean {
    return this.visibleAnswers[questionId] || false;
  }
<<<<<<< HEAD

  // Phương thức để cập nhật công thức hiển thị
  updateVisibleRecipes(): void {
    const start = this.currentRecipePage * this.recipesPerPage;
    const end = start + this.recipesPerPage;
    this.visibleRecipes = this.suggestedRecipes.slice(start, end);
  }

  // Phương thức để điều hướng trang công thức
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

  // Phương thức để tải sản phẩm gợi ý
  loadSuggestedProducts(allProducts: Product[]): void {
    // Lọc bỏ sản phẩm hiện tại
    const filteredProducts = allProducts.filter(
      (p) => p._id !== this.product?._id
    );

    // Nếu có sản phẩm liên quan, ưu tiên sản phẩm liên quan
    if (this.relatedProducts.length > 0) {
      this.suggestedProducts = [...this.relatedProducts];

      // Nếu sản phẩm liên quan ít hơn 9, bổ sung thêm sản phẩm ngẫu nhiên
      if (this.suggestedProducts.length < 9) {
        const remainingProductsNeeded = 9 - this.suggestedProducts.length;
        const otherProducts = filteredProducts
          .filter((p) => !this.relatedProducts.some((rp) => rp._id === p._id))
          .sort(() => 0.5 - Math.random())
          .slice(0, remainingProductsNeeded);

        this.suggestedProducts = [...this.suggestedProducts, ...otherProducts];
      }
    } else {
      // Nếu không có sản phẩm liên quan, lấy ngẫu nhiên 9 sản phẩm
      this.suggestedProducts = this.getRandomProducts(filteredProducts, 9);
    }

    this.updateVisibleProducts();
  }

  // Phương thức để lấy sản phẩm ngẫu nhiên
  getRandomProducts(products: Product[], count: number): Product[] {
    if (!products || products.length === 0) return [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Phương thức để cập nhật sản phẩm hiển thị
  updateVisibleProducts(): void {
    const start = this.currentProductPage * this.productsPerPage;
    const end = start + this.productsPerPage;
    this.visibleProducts = this.suggestedProducts.slice(start, end);
  }

  // Phương thức để điều hướng trang sản phẩm
  prevProductPage(): void {
    if (this.currentProductPage > 0) {
      this.currentProductPage--;
      this.updateVisibleProducts();
    }
  }

  nextProductPage(): void {
    if (
      this.currentProductPage <
      Math.ceil(this.suggestedProducts.length / this.productsPerPage) - 1
    ) {
      this.currentProductPage++;
      this.updateVisibleProducts();
    }
  }

  // Kiểm tra trạng thái yêu thích của sản phẩm
  checkProductFavoriteStatus(productId: string): void {
    // Kiểm tra user đã đăng nhập chưa
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return;
    }

    this.favoritesService.checkFavorite(productId, 'product').subscribe({
      next: (isFavorite) => {
        this.isSavedProduct = isFavorite;
        console.log(`Sản phẩm ${productId} đã được lưu: ${isFavorite}`);
      },
      error: (error) => {
        console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
      }
    });
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
      this.notification = {
        ...this.notification,
        show: false
      };
    }, 3000);
  }

  // Kiểm tra sản phẩm đã lưu chưa
  isProductSaved(productId: string): boolean {
    return this.savedProducts.has(productId);
  }

  // Kiểm tra công thức đã lưu chưa
  isRecipeSaved(recipeId: string): boolean {
    return this.savedRecipes.has(recipeId);
  }

  // Lưu công thức vào yêu thích
  toggleSaveRecipe(event: Event, recipeId: string): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      return;
    }
    
    // Đảm bảo recipeId không phải undefined
    if (!recipeId) {
      console.error('ID công thức không được cung cấp');
      this.showNotification('Không thể lưu công thức này. Xin vui lòng thử lại sau.', 'error');
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Recipe ID info:', {
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
              this.showNotification('Đã xóa công thức khỏi danh sách yêu thích', 'success');
            } else {
              this.savedRecipes.add(recipeId);
              this.showNotification('Đã thêm công thức vào danh sách yêu thích', 'success');
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
}
=======
}
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
