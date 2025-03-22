import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../services/search.service';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-tim-kiem',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FooterComponent],
  template: `
    <div class="container search-results-page">
      <div class="search-header">
        <h1>
          Xem tất cả kết quả cho
          <span class="search-term">"{{ searchTerm }}"</span>
        </h1>

        <div class="search-stats">
          <span *ngIf="loading">Đang tìm kiếm...</span>
          <span *ngIf="!loading && totalResults > 0"
            >{{ totalResults }} kết quả</span
          >
          <span *ngIf="!loading && totalResults === 0"
            >Không tìm thấy kết quả nào</span
          >
        </div>
      </div>

      <!-- Hiển thị công thức -->
      <div
        class="result-section"
        *ngIf="searchResults.recipes && searchResults.recipes.length > 0"
      >
        <h2>Công thức</h2>
        <div class="products-grid-large">
          <div
            class="product-card product-card-large"
            *ngFor="let recipe of searchResults.recipes"
          >
            <a [routerLink]="['/cong-thuc', recipe._id]">
              <div class="product-image-container">
                <img
                  [src]="recipe.recipeImage"
                  [alt]="recipe.recipeName"
                  class="product-image"
                  onerror="this.src='../../assets/default-image.jpg'"
                />
              </div>
              <div class="product-content">
                <h3 class="product-title">{{ recipe.recipeName }}</h3>
                <div class="product-info">
                  <div class="info-item">
                    <img
                      src="../../assets/san-pham/khauphan.svg"
                      alt="Khẩu phần"
                    />
                    <span>4 Người</span>
                  </div>
                  <div class="info-item">
                    <img src="../../assets/san-pham/dokho.svg" alt="Độ khó" />
                    <span>{{ recipe.difficulty }}</span>
                  </div>
                  <div class="info-item">
                    <img
                      src="../../assets/san-pham/ph-cooking-pot.svg"
                      alt="Thời gian"
                    />
                    <span>{{ recipe.time }}</span>
                  </div>
                </div>
                <div class="product-actions">
                  <div class="button-camnhat">XEM CHI TIẾT</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Hiển thị nguyên liệu -->
      <div
        class="result-section"
        *ngIf="searchResults.products && searchResults.products.length > 0"
      >
        <h2>Nguyên liệu</h2>
        <div class="products-grid-large">
          <div
            class="product-card product-card-large"
            *ngFor="let product of searchResults.products"
          >
            <a [routerLink]="['/chi-tiet-san-pham', product._id]">
              <div class="product-image-container">
                <img
                  [src]="product.mainImage"
                  [alt]="product.ingredientName"
                  class="product-image"
                  onerror="this.src='../../assets/default-image.jpg'"
                />
              </div>
              <div class="product-content">
                <h3 class="product-title">{{ product.ingredientName }}</h3>
                <div class="product-description" *ngIf="product.description">
                  {{ product.description | slice : 0 : 100
                  }}{{ product.description.length > 100 ? '...' : '' }}
                </div>
                <div class="product-details">
                  <div
                    class="price-container"
                    *ngIf="
                      product.pricePerPortion && product.pricePerPortion['2']
                    "
                  >
                    <div class="price-tag">
                      {{ product.pricePerPortion['2'] | number }} đ
                    </div>
                    <div class="price-label">Gói 2 người</div>
                  </div>
                  <div class="product-category" *ngIf="product.category">
                    <span class="category-label">Danh mục:</span>
                    <span class="category-value">{{ product.category }}</span>
                  </div>
                </div>
                <div class="product-actions">
                  <div class="button-camnhat">XEM CHI TIẾT</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Hiển thị blog -->
      <div
        class="result-section"
        *ngIf="searchResults.blogs && searchResults.blogs.length > 0"
      >
        <h2>Blog</h2>
        <div class="blog-grid">
          <div class="blog-card" *ngFor="let blog of searchResults.blogs">
            <a [routerLink]="['/blog', blog._id]">
              <img
                [src]="blog.thumbnail"
                [alt]="blog.title"
                class="blog-image"
                onerror="this.src='../../assets/default-image.jpg'"
              />
              <div class="blog-content">
                <h3 class="blog-title">{{ blog.title }}</h3>
                <p class="blog-excerpt">{{ blog.description }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Không tìm thấy kết quả -->
      <div class="no-results" *ngIf="!loading && totalResults === 0">
        <div class="no-results-content">
          <i
            class="bi bi-search"
            style="font-size: 60px; color: #ccc; margin-bottom: 20px;"
          ></i>
          <h3>Không tìm thấy kết quả nào phù hợp</h3>
          <p>
            Vui lòng thử lại với từ khóa khác hoặc duyệt theo danh mục dưới đây
          </p>

          <div class="suggested-categories">
            <a routerLink="/cong-thuc" class="suggested-category">
              <span>Công thức</span>
            </a>
            <a routerLink="/san-pham" class="suggested-category">
              <span>Nguyên liệu</span>
            </a>
            <a routerLink="/blog" class="suggested-category">
              <span>Blog</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .search-results-page {
        padding: 40px 15px;
        min-height: 60vh;
        max-width: 1200px;
        margin: 0 auto;
      }

      .search-header {
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }

      .search-header h1 {
        font-size: 28px;
        color: var(--color-camdam);
        margin-bottom: 10px;
        text-align: center;
      }

      .search-term {
        font-weight: 600;
      }

      .search-stats {
        color: #666;
        text-align: center;
      }

      .result-section {
        margin-bottom: 40px;
      }

      .result-section h2 {
        font-size: 20px;
        margin-bottom: 20px;
        color: var(--color-camvua);
        position: relative;
        padding-left: 15px;
      }

      .result-section h2:before {
        content: '';
        position: absolute;
        left: 0;
        top: 5px;
        bottom: 5px;
        width: 5px;
        background-color: var(--color-camdam);
        border-radius: 3px;
      }

      .products-grid,
      .blog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
      }

      .products-grid-large {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 25px;
      }

      .product-card,
      .blog-card {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s, box-shadow 0.3s;
        height: 100%;
      }

      .product-card-large {
        display: flex;
        flex-direction: column;
      }

      .product-card-large a {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .product-card:hover,
      .blog-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      }

      .product-card a,
      .blog-card a {
        text-decoration: none;
        color: inherit;
        display: block;
        height: 100%;
      }

      .product-image-container {
        overflow: hidden;
        height: 240px;
      }

      .product-image,
      .blog-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }

      .product-card:hover .product-image {
        transform: scale(1.05);
      }

      .product-content,
      .blog-content {
        padding: 15px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .product-title,
      .blog-title {
        font-size: 12px;
        margin-bottom: 10px;
        color: black !important;
        font-weight: 600;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        height: auto;
        max-height: 40px;
      }

      .product-description {
        font-size: 13px;
        color: #666;
        margin-bottom: 15px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .product-details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }

      .price-container {
        display: flex;
        flex-direction: column;
      }

      .price-tag {
        font-weight: bold;
        color: var(--color-camdam);
        font-size: 18px;
      }

      .price-label {
        font-size: 12px;
        color: #888;
      }

      .product-category {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .category-label {
        font-size: 11px;
        color: #888;
      }

      .category-value {
        font-size: 13px;
        color: #555;
        font-weight: 500;
      }

      .product-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 15px;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
        color: black;
        background-color: var(--color-xamnhat);
        padding: 4px 4px;
        border-radius: 4px;
      }

      .info-item img {
        width: 16px;
        height: 16px;
      }

      .product-actions,
      .blog-actions {
        margin-top: auto;
      }

      .blog-excerpt {
        font-size: 13px;
        color: #666;
        margin-bottom: 10px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }

      .no-results {
        text-align: center;
        padding: 50px 0;
      }

      .no-results-content {
        max-width: 500px;
        margin: 0 auto;
      }

      .no-results img {
        width: 100px;
        height: 100px;
        margin-bottom: 20px;
        opacity: 0.6;
      }

      .no-results h3 {
        font-size: 20px;
        margin-bottom: 10px;
        color: #333;
      }

      .no-results p {
        font-size: 14px;
        color: #666;
        margin-bottom: 25px;
      }

      .suggested-categories {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
      }

      .suggested-category {
        display: inline-block;
        padding: 10px 20px;
        background-color: #f8f8f8;
        border-radius: 30px;
        text-decoration: none;
        color: #333;
        transition: background-color 0.3s;
      }

      .suggested-category:hover {
        background-color: var(--color-camnhat);
        color: white;
      }

      @media (max-width: 992px) {
        .products-grid-large {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
      }

      @media (max-width: 768px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }

        .products-grid-large {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .blog-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
      }

      @media (max-width: 576px) {
        .products-grid,
        .products-grid-large,
        .blog-grid {
          grid-template-columns: 1fr;
        }

        .search-header h1 {
          font-size: 20px;
        }
      }
    `,
  ],
})
export class TimKiemComponent implements OnInit {
  searchTerm: string = '';
  searchResults: SearchResult = { recipes: [], products: [], blogs: [] };
  loading: boolean = true;
  totalResults: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    // Lấy query param từ URL
    this.route.queryParams.subscribe((params) => {
      this.searchTerm = params['q'] || '';
      if (this.searchTerm) {
        this.performSearch();
      } else {
        this.loading = false;
      }
    });
  }

  performSearch(): void {
    this.loading = true;

    // Sử dụng full search (không giới hạn số lượng kết quả)
    this.searchService.search(this.searchTerm).subscribe({
      next: (results) => {
        this.searchResults = results;

        // Tính tổng số kết quả
        this.totalResults =
          (results.recipes ? results.recipes.length : 0) +
          (results.products ? results.products.length : 0) +
          (results.blogs ? results.blogs.length : 0);

        this.loading = false;
      },
      error: (error) => {
        console.error('Lỗi khi tìm kiếm:', error);
        this.loading = false;
      },
    });
  }
}
