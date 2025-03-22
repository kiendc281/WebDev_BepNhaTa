import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Product } from '../models/product.interface';
import { FavoritesService } from '../services/favorites.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-san-pham',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './san-pham.component.html',
  styleUrls: ['./san-pham.component.css'],
})
export class SanPhamComponent implements OnInit {
  products: Product[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  displayedPages: number[] = [1, 2, 3, 4, 5];
  sortOptions = [
    { value: 'default', label: 'Mặc định' },
    { value: 'price-asc', label: 'Giá: Thấp đến cao' },
    { value: 'price-desc', label: 'Giá: Cao đến thấp' },
    { value: 'name-asc', label: 'Tên: A đến Z' },
    { value: 'name-desc', label: 'Tên: Z đến A' },
  ];
  selectedSort: string = 'default';
  showSortDropdown: boolean = false;
  selectedCategory: string = 'all';
  savedProducts: Set<string> = new Set();
  notification: { show: boolean; message: string; type: 'success' | 'error' } =
    {
      show: false,
      message: '',
      type: 'success',
    };

  // Thêm các biến cho bộ lọc nguyên liệu
  showFilterDropdown: boolean = false;
  ingredientsList: string[] = [];
  selectedIngredients: string[] = [];
  @ViewChild('ingredientSearch') ingredientSearch!: ElementRef;
  filteredIngredientsList: string[] = [];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    // Subscribe to query params changes
    this.route.queryParams.subscribe((params) => {
      const category = params['category'];
      if (category) {
        this.selectedCategory = category;
        this.filterByCategory(category);
      } else {
        this.loadProducts();
      }
    });

    this.checkSavedProducts();
  }

  checkSavedProducts(): void {
    this.favoritesService.getFavoritesWithDetails('product').subscribe(
      (favorites) => {
        this.savedProducts.clear();

        favorites.forEach((item) => {
          if (item.targetId) {
            this.savedProducts.add(item.targetId);
            console.log('Đã đánh dấu sản phẩm đã lưu:', item.targetId);
          }
        });
      },
      (error) => {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
      }
    );
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

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('Dữ liệu sản phẩm nhận được:', data.slice(0, 2)); // Log 2 sản phẩm đầu tiên để kiểm tra

        // Kiểm tra định dạng ID
        if (data.length > 0) {
          const firstProduct = data[0];
          console.log('Dữ liệu mẫu:', {
            id: firstProduct._id,
            idType: typeof firstProduct._id,
            idLength: firstProduct._id ? firstProduct._id.length : 'undefined',
            stringified: JSON.stringify(firstProduct),
            hasIdProperty: '_id' in firstProduct,
          });
        }

        this.products = data;
        this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
        this.updateDisplayedPages();

        // Trích xuất danh sách nguyên liệu
        this.extractIngredients();
      },
      error: (err) => {
        console.error('Lỗi khi tải sản phẩm:', err);
      },
    });
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedPages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedPages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  updateDisplayedPages(): void {
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

  // Filter methods
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;

    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (category === 'all') {
      this.loadProducts();
    } else {
      // Map category codes to API values
      const categoryMap: { [key: string]: string } = {
        'mon-man': 'Món mặn',
        'mon-xao': 'Xào',
        'mon-nuoc': 'Nước',
        'mon-tron': 'Trộn',
      };

      this.productService
        .getProductsByCategory(categoryMap[category])
        .subscribe({
          next: (data) => {
            this.products = data;
            this.totalPages = Math.ceil(
              this.products.length / this.itemsPerPage
            );
            this.updateDisplayedPages();

            // Trích xuất danh sách nguyên liệu
            this.extractIngredients();

            // Áp dụng lọc nguyên liệu nếu có
            this.filterByIngredients();
          },
          error: (err) => {
            console.error('Lỗi khi tải sản phẩm:', err);
          },
        });
    }
  }

  getSelectedSortLabel(): string {
    return (
      this.sortOptions.find((opt) => opt.value === this.selectedSort)?.label ||
      'Mặc định'
    );
  }

  toggleSortDropdown(): void {
    this.showSortDropdown = !this.showSortDropdown;
  }

  selectSort(option: string): void {
    this.selectedSort = option;
    this.showSortDropdown = false;
    this.sortProducts();
  }

  sortProducts(): void {
    switch (this.selectedSort) {
      case 'price-asc':
        this.products.sort(
          (a, b) => this.getDiscountedPrice(a) - this.getDiscountedPrice(b)
        );
        break;
      case 'price-desc':
        this.products.sort(
          (a, b) => this.getDiscountedPrice(b) - this.getDiscountedPrice(a)
        );
        break;
      case 'name-asc':
        this.products.sort((a, b) =>
          a.ingredientName.localeCompare(b.ingredientName)
        );
        break;
      case 'name-desc':
        this.products.sort((a, b) =>
          b.ingredientName.localeCompare(a.ingredientName)
        );
        break;
      default:
        // Reset to original order
        this.loadProducts();
        return;
    }
    this.currentPage = 1;
    this.updateDisplayedPages();
  }

  // Kiểm tra xem sản phẩm có giảm giá không
  hasDiscount(product: Product): boolean {
    return product?.discount !== undefined && product.discount > 0;
  }

  // Lấy giá gốc của sản phẩm (mặc định là khẩu phần 2 người)
  getOriginalPrice(product: Product): number {
    if (!product?.pricePerPortion) return 0;
    return product.pricePerPortion['2'] || 0;
  }

  // Lấy giá sau khi giảm giá
  getDiscountedPrice(product: Product): number {
    const originalPrice = this.getOriginalPrice(product);
    if (!product?.discount || product.discount <= 0) {
      return originalPrice;
    }
    return Math.round(originalPrice * (1 - product.discount / 100));
  }

  sortByName(order: 'asc' | 'desc'): void {
    if (order === 'asc') {
      this.products.sort((a, b) =>
        a.ingredientName.localeCompare(b.ingredientName)
      );
    } else {
      this.products.sort((a, b) =>
        b.ingredientName.localeCompare(a.ingredientName)
      );
    }
  }

  // Lưu vào yêu thích
  toggleSaveProduct(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra đăng nhập trước khi thực hiện
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.showNotification(
        'Vui lòng đăng nhập để sử dụng tính năng này',
        'error'
      );
      return;
    }

    // Log thông tin chi tiết để debug
    console.log('Product info:', {
      id: product._id,
      name: product.ingredientName,
      idType: typeof product._id,
      idLength: product._id ? product._id.length : 'undefined',
      rawProduct: JSON.stringify(product),
    });

    // Đảm bảo sản phẩm có ID trước khi thực hiện
    if (!product._id && !product.id) {
      console.error('Sản phẩm không có ID', product);
      this.showNotification(
        'Không thể lưu sản phẩm này. Xin vui lòng thử lại sau.',
        'error'
      );
      return;
    }

    // Ưu tiên sử dụng product._id, nếu không có thì dùng product.id
    // Sử dụng type assertion để khẳng định với TypeScript rằng productId không phải undefined
    const productId = (product._id || product.id) as string;

    // Log để theo dõi
    console.log(
      `Xử lý lưu sản phẩm: ${product.ingredientName} với ID: ${productId}`
    );

    const isSaved = this.isProductSaved(productId);

    console.log(
      'Đang lưu sản phẩm:',
      productId,
      'loại:',
      'product',
      'trạng thái hiện tại:',
      isSaved
    );

    this.favoritesService
      .toggleFavorite(productId, 'product', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Kết quả lưu:', response);
          if (response.success) {
            if (isSaved) {
              this.savedProducts.delete(productId);
              console.log(`Đã xóa sản phẩm ${productId} khỏi danh sách đã lưu`);
              this.showNotification(
                `Đã xóa "${product.ingredientName}" khỏi danh sách yêu thích`,
                'success'
              );
            } else {
              this.savedProducts.add(productId);
              console.log(`Đã thêm sản phẩm ${productId} vào danh sách đã lưu`);
              this.showNotification(
                `Đã thêm "${product.ingredientName}" vào danh sách yêu thích`,
                'success'
              );
            }
          } else {
            console.error('Không thể lưu sản phẩm:', response.message);
            this.showNotification(
              response.message ||
                'Không thể lưu sản phẩm. Vui lòng đăng nhập để sử dụng tính năng này.',
              'error'
            );
          }
        },
        error: (error) => {
          console.error('Lỗi khi lưu sản phẩm:', error);
          this.showNotification(
            'Đã xảy ra lỗi khi lưu sản phẩm. Vui lòng thử lại sau.',
            'error'
          );
        },
      });
  }

  // Kiểm tra đã lưu chưa
  isProductSaved(productId: string): boolean {
    return this.savedProducts.has(productId);
  }

  // Phương thức lấy danh sách thành phần từ tất cả các sản phẩm
  extractIngredients(): void {
    const allIngredients = new Set<string>();

    // Kiểm tra xem products có dữ liệu không
    if (!this.products || this.products.length === 0) {
      console.log('Không có dữ liệu sản phẩm để trích xuất thành phần');
      return;
    }

    // Log debug thông tin
    console.log(
      `Bắt đầu trích xuất thành phần từ ${this.products.length} sản phẩm`
    );

    // Trích xuất từ mảng components của mỗi sản phẩm
    this.products.forEach((product, index) => {
      try {
        if (product && product.components) {
          product.components.forEach((component) => {
            if (component) {
              allIngredients.add(component.trim());
            }
          });
        }
      } catch (err) {
        console.error(`Lỗi khi xử lý sản phẩm ${index}:`, err);
      }
    });

    // Chuyển đổi Set thành mảng và sắp xếp
    this.ingredientsList = Array.from(allIngredients).sort();
    this.filteredIngredientsList = [...this.ingredientsList];

    console.log(
      `Đã trích xuất được ${this.ingredientsList.length} thành phần:`,
      this.ingredientsList
    );
  }

  // Phương thức lọc sản phẩm theo thành phần đã chọn
  filterByIngredients(): void {
    if (this.selectedIngredients.length === 0) {
      // Nếu không có thành phần nào được chọn, hiển thị tất cả sản phẩm
      return;
    }

    console.log('Đang lọc theo thành phần:', this.selectedIngredients);

    const filteredProducts = this.products.filter((product) => {
      if (!product.components || product.components.length === 0) {
        return false;
      }

      // Kiểm tra xem sản phẩm có chứa bất kỳ thành phần đã chọn nào không
      for (const selectedIng of this.selectedIngredients) {
        if (product.components.some((comp) => comp.trim() === selectedIng)) {
          console.log(
            `Tìm thấy thành phần ${selectedIng} trong sản phẩm ${product.ingredientName}`
          );
          return true;
        }
      }
      return false;
    });

    this.products = filteredProducts;
    this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updateDisplayedPages();
  }

  // Phương thức để đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.filter-dropdown-container')) {
      this.showFilterDropdown = false;
    }
  }

  // Phương thức để xử lý hiển thị và ẩn bộ lọc
  toggleFilterDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showFilterDropdown = !this.showFilterDropdown;

    if (this.showFilterDropdown) {
      this.filteredIngredientsList = [...this.ingredientsList];
      setTimeout(() => {
        if (this.ingredientSearch) {
          this.ingredientSearch.nativeElement.focus();
        }
      }, 100);
    }
  }

  // Phương thức để lọc danh sách nguyên liệu khi gõ vào ô tìm kiếm
  searchIngredients(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredIngredientsList = this.ingredientsList.filter((ingredient) =>
      ingredient.toLowerCase().includes(searchValue)
    );
  }

  // Phương thức để chọn/bỏ chọn nguyên liệu
  toggleIngredient(ingredient: string): void {
    const index = this.selectedIngredients.indexOf(ingredient);
    if (index > -1) {
      this.selectedIngredients.splice(index, 1);
    } else {
      this.selectedIngredients.push(ingredient);
    }
    // Đặt lại về trang 1 và áp dụng bộ lọc
    this.currentPage = 1;
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.filterByIngredients();
  }

  // Phương thức để xóa tất cả bộ lọc
  clearFilters(): void {
    this.selectedIngredients = [];
    this.selectedCategory = 'all';
    this.currentPage = 1;
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadProducts();
  }
}
