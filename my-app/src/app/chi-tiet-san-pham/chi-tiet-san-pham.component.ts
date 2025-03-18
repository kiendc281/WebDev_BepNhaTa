import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { CartManagerService } from '../services/cart-manager.service';
import { AuthService } from '../services/auth.service';
import { CartItem } from '../models/cart.interface';
import { Subscription } from 'rxjs';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartManagerService,
    private authService: AuthService,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to handle navigation between related products
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.resetProductData();
        this.loadProduct(id);
      } else {
        this.error = 'Không tìm thấy mã sản phẩm';
        this.loading = false;
      }
    });

    // Generate thumbnails (temporary)
    for (let i = 0; i < 5; i++) {
      this.thumbnails.push('../../assets/san-pham/thumbnail.jpg');
    }

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

          // Kiểm tra và log thành phần nguyên liệu
          if (this.product.components && this.product.components.length > 0) {
            console.log('Thành phần nguyên liệu:', this.product.components);
          } else {
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

    if (
      !this.product.pricePerPortion ||
      Object.keys(this.product.pricePerPortion).length === 0
    ) {
      console.error(
        'Không tìm thấy thông tin giá theo khẩu phần cho sản phẩm:',
        this.product.ingredientName
      );
      this._currentOriginalPrice = 0;
      this._currentDiscountedPrice = 0;
      return;
    }

    // Kiểm tra xem khẩu phần đã chọn có giá trực tiếp không
    if (!this.product.pricePerPortion[this.selectedServing]) {
      // Nếu là khẩu phần 4 người và có giá cho 2 người, không cần thông báo lỗi vì đã xử lý ở ProductService
      if (
        !(this.selectedServing === '4' && this.product.pricePerPortion['2'])
      ) {
        // Chỉ thông báo cho các trường hợp khác
        const availablePortions = Object.keys(this.product.pricePerPortion);
        if (availablePortions.length > 0) {
          this.selectedServing = availablePortions[0];
          console.log(
            `Chuyển sang khẩu phần ${this.selectedServing} vì không tìm thấy giá cho khẩu phần đã chọn`
          );
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
  }

  addToWishlist(): void {
    if (this.product) {
      console.log('Thêm vào danh sách yêu thích:', this.product.ingredientName);
      // Implement wishlist logic here
    }
  }

  buyNow(): void {
    if (!this.product) return;

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

  // Phương thức để tải công thức gợi ý
  loadSuggestedRecipes(): void {
    this.recipeService.getRecipes().subscribe({
      next: (data) => {
        this.suggestedRecipes = this.getRandomRecipes(data, 9); // Lấy 9 công thức ngẫu nhiên
        this.updateVisibleRecipes();
      },
      error: (err) => {
        console.error('Lỗi khi tải công thức gợi ý:', err);
      },
    });
  }

  // Phương thức để lấy công thức ngẫu nhiên
  getRandomRecipes(recipes: Recipe[], count: number): Recipe[] {
    if (!recipes || recipes.length === 0) return [];
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

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
}
