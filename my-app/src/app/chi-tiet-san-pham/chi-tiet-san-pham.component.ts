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
      const id = Number(params['id']);
      if (id) {
        this.loadProduct(id);
      }
    });

    // Generate thumbnails (temporary)
    for (let i = 0; i < 5; i++) {
      this.thumbnails.push('../../assets/san-pham/thumbnail.jpg');
    }
  }

  loadProduct(id: number): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.product = products.find((p) => p.id === id) || null;
        if (this.product) {
          this.loadRelatedProducts();
          // Reset quantity and serving size when loading new product
          this.quantity = 1;
          this.selectedServing = '2';
        }
      },
      error: (error) => {
        console.error('Error loading product:', error);
      },
    });
  }

  loadRelatedProducts(): void {
    if (this.product) {
      this.productService
        .getRelatedProducts(this.product.category, this.product.id)
        .subscribe({
          next: (products) => {
            this.relatedProducts = products;
          },
          error: (error) => {
            console.error('Error loading related products:', error);
          },
        });
    }
  }

  // Method to handle related product navigation
  navigateToProduct(productId: number): void {
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

  selectServing(serving: string): void {
    this.selectedServing = serving;
  }

  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }

  addToCart(): void {
    if (this.product) {
      console.log(
        'Thêm vào giỏ hàng:',
        this.product.title,
        'Số lượng:',
        this.quantity
      );
      // Implement cart logic here
    }
  }

  addToWishlist(): void {
    if (this.product) {
      console.log('Thêm vào danh sách yêu thích:', this.product.title);
      // Implement wishlist logic here
    }
  }

  buyNow(): void {
    if (this.product) {
      console.log('Mua ngay:', this.product.title, 'Số lượng:', this.quantity);
      // Implement buy now logic here
    }
  }
}
