import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit, OnDestroy {
  // Biến theo dõi sắp xếp
  sortColumn: string = '_id'; // Mặc định sắp xếp theo mã sản phẩm
  sortDirection: 'asc' | 'desc' = 'asc'; // Mặc định sắp xếp tăng dần

  // Biến lọc
  filterCategory: string = '';
  filterRegion: string = '';
  filterStatus: string = '';
  searchTerm: string = '';

  // API products
  originalProducts: Product[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  // Trạng thái loading
  isLoading: boolean = false;
  error: string | null = null;

  // Biến phân trang
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;

  // Biến quản lý dropdown đang mở
  openDropdown: string | null = null;

  // Quản lý các sản phẩm được chọn
  selectedProductIds: string[] = [];
  allProductsSelected: boolean = false;

  // Quản lý hành động hàng loạt
  selectedAction: string = '';

  // Biến lưu ID của timer để có thể hủy
  private hideMenuTimer: any;
  private currentActiveMenu: string | null = null;

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    // Kiểm tra nếu vừa cập nhật sản phẩm từ trang chi tiết
    const needRefresh = localStorage.getItem('productUpdated') === 'true';
    if (needRefresh) {
      // Xóa thông tin đã sử dụng
      localStorage.removeItem('productUpdated');
      // Làm mới trang để tải lại dữ liệu
      window.location.reload();
    } else {
      // Tải dữ liệu sản phẩm bình thường
      this.loadProducts();
    }

    // Tạo bound function một lần để tránh vấn đề với việc remove listener
    this.boundCloseDropdownHandler = this.closeDropdownOutside.bind(this);

    // Thêm event listener để đóng dropdown khi click ra ngoài
    // Sử dụng setTimeout để đảm bảo event listener được thêm sau khi component đã render
    setTimeout(() => {
      document.addEventListener('click', this.boundCloseDropdownHandler);
    }, 0);
  }

  // Property để lưu trữ bound function
  private boundCloseDropdownHandler: any;

  // Lấy danh sách sản phẩm từ API
  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    const filters = {
      category: this.filterCategory,
      region: this.filterRegion,
      status: this.filterStatus,
      search: this.searchTerm,
    };

    this.productService.getAllProducts(filters).subscribe({
      next: (data) => {
        this.originalProducts = data;
        this.totalItems = data.length;
        this.transformProducts();
        this.sortProducts(this.sortColumn, this.sortDirection);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
        this.error = 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  // Chuyển đổi dữ liệu sản phẩm từ API để phù hợp với giao diện
  transformProducts(): void {
    // Tạo danh sách sản phẩm đã chuyển đổi
    this.products = this.originalProducts.map((product) => {
      // Lấy giá từ pricePerPortion
      const price = product.pricePerPortion?.['2'] || 0;
      const formattedPrice = price.toLocaleString('vi-VN') + 'đ';

      // Lấy số lượng từ portionQuantities
      const quantity2 = product['portionQuantities']?.['2'] || 0;
      const quantity4 = product['portionQuantities']?.['4'] || 0;

      // Tự động cập nhật trạng thái dựa trên số lượng - LUÔN cập nhật trạng thái dựa trên số lượng
      let status = 'Còn hàng';

      // Nếu cả 2 khẩu phần đều là 0, đặt trạng thái là "Hết hàng"
      if (quantity2 === 0 && quantity4 === 0) {
        status = 'Hết hàng';
      }

      // Ghi log để kiểm tra
      console.log(
        `Sản phẩm ${product._id}: số lượng (${quantity2}, ${quantity4}), trạng thái API: ${product.status}, trạng thái hiển thị: ${status}`
      );

      // Tạo ngày từ expirationDate hoặc ngày hiện tại nếu không có
      const date = product.expirationDate
        ? new Date(product.expirationDate)
        : new Date();

      // Format ngày dạng dd/MM/yyyy
      const formattedDate = date.toLocaleDateString('vi-VN');

      return {
        ...product,
        name: product.ingredientName,
        code: product._id,
        price: formattedPrice,
        numericPrice: price,
        date: formattedDate,
        timestamp: date.getTime(),
        tags: product.tags || [],
        quantity2,
        quantity4,
        status: status, // Luôn sử dụng trạng thái được tính toán dựa trên số lượng
      };
    });

    // Nếu đã áp dụng bộ lọc trạng thái, cần lọc lại dựa trên trạng thái đã được tính toán
    if (this.filterStatus) {
      console.log('Lọc theo trạng thái:', this.filterStatus);
      // Lọc lại sản phẩm dựa trên trạng thái đã tính toán
      this.products = this.products.filter(
        (product) => product.status === this.filterStatus
      );
      // Cập nhật tổng số sản phẩm sau khi lọc
      this.totalItems = this.products.length;
    }
  }

  // Hàm xử lý sắp xếp khi click vào header
  sort(column: string, event?: MouseEvent): void {
    // Ngăn sự kiện click lan truyền lên parent elements
    if (event) {
      event.stopPropagation();
    }

    // Chuyển đổi tên cột giao diện sang tên cột API
    const apiColumnMap: { [key: string]: string } = {
      name: 'ingredientName',
      code: '_id',
      price: 'price',
      price2: 'price2',
      price4: 'price4',
      date: 'timestamp',
      quantity2: 'quantity2',
      quantity4: 'quantity4',
    };

    // Lấy tên cột API tương ứng
    const apiColumn = apiColumnMap[column] || column;

    // Nếu click vào cùng một cột đang sắp xếp, đảo ngược thứ tự sắp xếp
    if (this.sortColumn === apiColumn) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu click vào cột khác, chuyển sang sắp xếp cột mới theo thứ tự tăng dần
      this.sortColumn = apiColumn;
      this.sortDirection = 'asc';
    }

    // Nếu cột là price2 hoặc price4, cập nhật sản phẩm với giá tương ứng
    if (column === 'price2' || column === 'price4') {
      this.transformProductPrices(column.replace('price', ''));
    }

    // Sắp xếp sản phẩm theo column và direction mới
    this.sortProducts(this.sortColumn, this.sortDirection);
  }

  // Cập nhật giá theo khẩu phần được chọn
  transformProductPrices(portion: string): void {
    this.products = this.products.map((product) => {
      return {
        ...product,
        numericPrice: product.pricePerPortion?.[portion] || 0,
      };
    });
  }

  // Hàm sắp xếp danh sách sản phẩm
  sortProducts(column: string, direction: 'asc' | 'desc'): void {
    this.products = [...this.products].sort((a, b) => {
      let valueA: any, valueB: any;

      // Xác định giá trị so sánh cho từng loại cột
      switch (column) {
        case 'ingredientName':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case '_id':
          valueA = a.code || '';
          valueB = b.code || '';
          break;
        case 'price':
        case 'price2':
          valueA = a.pricePerPortion?.['2'] || 0;
          valueB = b.pricePerPortion?.['2'] || 0;
          break;
        case 'price4':
          valueA = a.pricePerPortion?.['4'] || 0;
          valueB = b.pricePerPortion?.['4'] || 0;
          break;
        case 'timestamp':
          valueA = a.timestamp || 0;
          valueB = b.timestamp || 0;
          break;
        case 'quantity2':
          valueA = this.getPortionQuantity(a, '2');
          valueB = this.getPortionQuantity(b, '2');
          break;
        case 'quantity4':
          valueA = this.getPortionQuantity(a, '4');
          valueB = this.getPortionQuantity(b, '4');
          break;
        default:
          valueA = a[column] || '';
          valueB = b[column] || '';
      }

      // So sánh giá trị dựa vào direction
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Tính tổng số trang
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Helper method để tạo mảng số trang
  getPageArray(): number[] {
    return Array.from({ length: this.getTotalPages() }, (_, i) => i + 1);
  }

  // Đếm số lượng sản phẩm theo từng trạng thái
  getProductCountByStatus(status: string): number {
    return this.originalProducts.filter((p) => p.status === status).length;
  }

  // Actions
  addProduct() {
    console.log('Add product clicked');
  }

  batchImport() {
    console.log('Batch import clicked');
  }

  batchExport() {
    console.log('Batch export clicked');
  }

  applyFilter() {
    this.isLoading = true;
    this.error = null;

    const filters = {
      category: this.filterCategory,
      region: this.filterRegion,
      status: '', // Xóa bỏ lọc trạng thái ban đầu vì sẽ lọc thủ công sau này
      search: this.searchTerm,
    };

    console.log('Applying filters:', filters);

    this.productService.getAllProducts(filters).subscribe({
      next: (data) => {
        this.originalProducts = data;
        this.totalItems = data.length;
        this.transformProducts(); // Phương thức này sẽ lọc lại theo trạng thái
        this.sortProducts(this.sortColumn, this.sortDirection);
        this.isLoading = false;

        console.log('Filtered products:', this.products);
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
        this.error = 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  search(event: any) {
    this.searchTerm = event.target.value;
    if (this.searchTerm.trim().length > 2) {
      this.applyFilter();
    }
  }

  // Toggle dropdown menu
  toggleDropdown(dropdown: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.openDropdown = this.openDropdown === dropdown ? null : dropdown;
  }

  // Đóng dropdown
  closeDropdown(): void {
    this.openDropdown = null;
  }

  // Xử lý chọn danh mục
  selectCategory(category: string): void {
    this.filterCategory = category;
    this.applyFilter();
  }

  // Xử lý chọn vùng miền
  selectRegion(region: string): void {
    this.filterRegion = region;
    this.applyFilter();
  }

  // Xử lý chọn trạng thái
  selectStatus(status: string): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  // Xử lý đóng dropdown khi click ra ngoài
  closeDropdownOutside(event: MouseEvent): void {
    if (this.openDropdown) {
      const target = event.target as HTMLElement;
      // Kiểm tra xem click có phải trong dropdown không
      if (!target.closest('.custom-dropdown')) {
        this.openDropdown = null;
      }
    }
  }

  // Cleanup event listener khi component bị hủy
  ngOnDestroy(): void {
    if (this.boundCloseDropdownHandler) {
      document.removeEventListener('click', this.boundCloseDropdownHandler);
    }
  }

  // Kiểm tra xem có sản phẩm nào được chọn không
  get hasSelectedProducts(): boolean {
    return this.selectedProductIds.length > 0;
  }

  // Kiểm tra xem một sản phẩm có được chọn không
  isProductSelected(productId: string): boolean {
    return this.selectedProductIds.includes(productId);
  }

  // Xử lý chọn/bỏ chọn một sản phẩm
  toggleProductSelection(productId: string): void {
    const index = this.selectedProductIds.indexOf(productId);
    if (index === -1) {
      this.selectedProductIds.push(productId);
    } else {
      this.selectedProductIds.splice(index, 1);
    }

    // Cập nhật trạng thái "chọn tất cả"
    this.updateAllSelectedState();
  }

  // Cập nhật trạng thái "chọn tất cả" dựa trên số lượng sản phẩm được chọn
  updateAllSelectedState(): void {
    const currentPageProducts = this.getCurrentPageProducts();
    this.allProductsSelected =
      currentPageProducts.length > 0 &&
      currentPageProducts.every(
        (product) =>
          product.code && this.selectedProductIds.includes(product.code)
      );
  }

  // Lấy danh sách sản phẩm trên trang hiện tại
  getCurrentPageProducts(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.products.length
    );
    return this.products.slice(startIndex, endIndex);
  }

  // Xử lý chọn/bỏ chọn tất cả sản phẩm trên trang hiện tại
  toggleAllProducts(): void {
    this.allProductsSelected = !this.allProductsSelected;

    const currentPageProducts = this.getCurrentPageProducts();
    if (this.allProductsSelected) {
      // Thêm tất cả sản phẩm trên trang hiện tại vào danh sách đã chọn
      currentPageProducts.forEach((product) => {
        if (product.code && !this.selectedProductIds.includes(product.code)) {
          this.selectedProductIds.push(product.code);
        }
      });
    } else {
      // Xóa tất cả sản phẩm trên trang hiện tại khỏi danh sách đã chọn
      currentPageProducts.forEach((product) => {
        if (product.code) {
          const index = this.selectedProductIds.indexOf(product.code);
          if (index !== -1) {
            this.selectedProductIds.splice(index, 1);
          }
        }
      });
    }
  }

  // Xử lý chọn hành động hàng loạt
  selectAction(action: string): void {
    this.selectedAction = action;
  }

  // Áp dụng hành động hàng loạt cho các sản phẩm đã chọn
  applyBatchAction(): void {
    if (!this.selectedAction || this.selectedProductIds.length === 0) {
      return;
    }

    // Lấy các sản phẩm đã chọn
    const selectedProducts = this.products.filter(
      (product) =>
        product.code && this.selectedProductIds.includes(product.code)
    );

    // Hiển thị tên hành động đồng nhất với tên trong dropdown
    switch (this.selectedAction) {
      case 'hide':
        console.log('Ẩn sản phẩm:', selectedProducts);
        // TODO: Implement hide product logic
        break;
      case 'price':
        console.log('Thay đổi giá:', selectedProducts);
        // TODO: Implement price change logic
        break;
      case 'stock':
        console.log('Cập nhật tồn kho:', selectedProducts);
        // TODO: Implement stock update logic
        break;
      case 'delete':
        console.log('Xóa sản phẩm:', selectedProducts);
        // TODO: Implement delete products logic
        break;
      default:
        break;
    }

    // Reset sau khi áp dụng
    // this.selectedProductIds = [];
    // this.selectedAction = '';
    // this.allProductsSelected = false;
  }

  // Lấy tên hiển thị của hành động dựa trên giá trị
  getActionName(actionValue: string): string {
    switch (actionValue) {
      case 'hide':
        return 'Ẩn sản phẩm';
      case 'price':
        return 'Thay đổi giá';
      case 'stock':
        return 'Cập nhật tồn kho';
      case 'delete':
        return 'Xóa sản phẩm';
      default:
        return 'Hành động hàng loạt';
    }
  }

  // Xử lý các hành động trên sản phẩm
  editProduct(product: any): void {
    console.log('Chỉnh sửa sản phẩm:', product);
    // Chuyển hướng đến trang chi tiết sản phẩm với ID sản phẩm
    this.router.navigate(['/san-pham/chinh-sua', product._id]);
  }

  duplicateProduct(product: any): void {
    console.log('Nhân đôi sản phẩm:', product);
    // TODO: Tạo bản sao của sản phẩm với dữ liệu tương tự
    // Có thể hiển thị form cho phép người dùng chỉnh sửa một số thông tin trước khi tạo bản sao
  }

  hideProduct(product: any): void {
    console.log('Ẩn sản phẩm:', product);
    // TODO: Cập nhật trạng thái ẩn của sản phẩm và làm mới danh sách
  }

  viewProduct(product: any): void {
    console.log('Xem sản phẩm:', product);
    // TODO: Chuyển đến trang chi tiết sản phẩm hoặc mở modal xem chi tiết
  }

  // Hiển thị menu hành động khi hover vào tên sản phẩm
  showActionsMenu(product: any): void {
    // Hủy timer ẩn menu nếu đang chạy
    if (this.hideMenuTimer) {
      clearTimeout(this.hideMenuTimer);
      this.hideMenuTimer = null;
    }

    // Lưu ID menu đang active
    this.currentActiveMenu = product.code ? product.code : null;
  }

  // Ẩn menu hành động với độ trễ khi move chuột ra khỏi tên sản phẩm
  hideActionsMenuWithDelay(product: any): void {
    // Đặt timer ẩn menu sau 300ms
    this.hideMenuTimer = setTimeout(() => {
      if (this.currentActiveMenu === product.code) {
        this.currentActiveMenu = null;
      }
      this.hideMenuTimer = null;
    }, 300);
  }

  // Hủy ẩn menu khi di chuột vào menu
  cancelHideMenu(): void {
    if (this.hideMenuTimer) {
      clearTimeout(this.hideMenuTimer);
      this.hideMenuTimer = null;
    }
  }

  // Ẩn menu ngay lập tức khi di chuột ra khỏi menu
  hideActionsMenu(): void {
    this.currentActiveMenu = null;
  }

  addNewProduct(): void {
    this.router.navigate(['/san-pham/them-moi']);
  }

  getPortionQuantity(product: Product, portion: string): number {
    return product['portionQuantities']?.[portion] || 0;
  }
}
