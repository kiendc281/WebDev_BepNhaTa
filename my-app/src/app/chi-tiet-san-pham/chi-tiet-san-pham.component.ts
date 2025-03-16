import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';

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
export class ChiTietSanPhamComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity: number = 1;
  selectedServing: string = '2';
  thumbnails: string[] = [];
  loading: boolean = true;
  error: string | null = null;

  // Lưu trữ giá hiện tại để tránh tính toán lại nhiều lần
  private _currentOriginalPrice: number = 0;
  private _currentDiscountedPrice: number = 0;

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
    private productService: ProductService
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
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('All products:', products);
        this.product = products.find((p) => p._id === id) || null;

        if (this.product) {
          console.log('Found product:', this.product);
          console.log('Product components:', this.product.components);
          console.log('Components type:', typeof this.product.components);
          console.log(
            'Is components array?',
            Array.isArray(this.product.components)
          );

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
        },
        error: (error) => {
          console.error('Error loading related products:', error);
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

    console.log('Dữ liệu sản phẩm trước khi tính giá:', this.product);

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
    if (this.product) {
      console.log(
        'Thêm vào giỏ hàng:',
        this.product.ingredientName,
        'Số lượng:',
        this.quantity,
        'Khẩu phần:',
        this.selectedServing,
        'Giá:',
        this.getDiscountedPrice()
      );
      // Implement cart logic here
    }
  }

  addToWishlist(): void {
    if (this.product) {
      console.log('Thêm vào danh sách yêu thích:', this.product.ingredientName);
      // Implement wishlist logic here
    }
  }

  buyNow(): void {
    if (this.product) {
      console.log(
        'Mua ngay:',
        this.product.ingredientName,
        'Số lượng:',
        this.quantity,
        'Khẩu phần:',
        this.selectedServing,
        'Giá:',
        this.getDiscountedPrice()
      );
      // Implement buy now logic here
    }
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
}
