import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit {
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

  // Trạng thái loading
  isLoading: boolean = false;
  error: string | null = null;

  // Biến phân trang
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

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
    this.products = this.originalProducts.map((product) => {
      const price = product.pricePerPortion['2'] || 0;
      const formattedPrice = price.toLocaleString('vi-VN') + 'đ';

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
      };
    });
  }

  // Hàm xử lý sắp xếp khi click vào header
  sort(column: string): void {
    // Chuyển đổi tên cột giao diện sang tên cột API
    const apiColumnMap: { [key: string]: string } = {
      name: 'ingredientName',
      code: '_id',
      price: 'price', // Sử dụng numericPrice trong hàm so sánh
      date: 'timestamp',
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

    // Sắp xếp sản phẩm theo column và direction mới
    this.sortProducts(this.sortColumn, this.sortDirection);
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
          valueA = a.numericPrice || 0;
          valueB = b.numericPrice || 0;
          break;
        case 'timestamp':
          valueA = a.timestamp || 0;
          valueB = b.timestamp || 0;
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
    this.loadProducts();
  }

  search(event: any) {
    this.searchTerm = event.target.value;
    if (this.searchTerm.trim().length > 2) {
      this.applyFilter();
    }
  }
}
