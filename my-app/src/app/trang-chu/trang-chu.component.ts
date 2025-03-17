import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { RouterModule } from '@angular/router';

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

  constructor(private router: Router, private productService: ProductService) {}

  ngOnInit() {
    this.startSlideTimer();
    this.loadHotProducts();
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
}
