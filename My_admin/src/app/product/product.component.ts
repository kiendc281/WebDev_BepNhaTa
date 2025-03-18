import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  code: string;
  status: string;
  price: string;
  numericPrice: number;
  category: string;
  tags: string[];
  date: string;
  timestamp: number;
  [key: string]: any; // Thêm index signature
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent {
  // Biến theo dõi sắp xếp
  sortColumn: string = 'code'; // Mặc định sắp xếp theo mã sản phẩm
  sortDirection: 'asc' | 'desc' = 'asc'; // Mặc định sắp xếp tăng dần

  // Data model for products
  originalProducts: Product[] = [
    {
      id: 1,
      name: 'Phở bò Bình Định',
      code: '20250221P01',
      status: 'Còn hàng',
      price: '120.000đ',
      numericPrice: 120000,
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '21/2/2025',
      timestamp: new Date('2025-02-21').getTime(),
    },
    {
      id: 2,
      name: 'Cuốn ram Bến Tre',
      code: '20250221P02',
      status: 'Còn hàng',
      price: '90.000đ',
      numericPrice: 90000,
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '20/2/2025',
      timestamp: new Date('2025-02-20').getTime(),
    },
    {
      id: 3,
      name: 'Bánh canh cua Cần Thơ',
      code: '20250221P03',
      status: 'Còn hàng',
      price: '150.000đ',
      numericPrice: 150000,
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '22/2/2025',
      timestamp: new Date('2025-02-22').getTime(),
    },
  ];

  // Products hiển thị trên bảng (có thể được sắp xếp)
  products: Product[] = [...this.originalProducts];

  constructor() {
    // Sắp xếp mặc định theo mã sản phẩm khi khởi tạo
    this.sortProducts(this.sortColumn, this.sortDirection);
  }

  // Hàm xử lý sắp xếp khi click vào header
  sort(column: string): void {
    // Nếu click vào cùng một cột đang sắp xếp, đảo ngược thứ tự sắp xếp
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nếu click vào cột khác, chuyển sang sắp xếp cột mới theo thứ tự tăng dần
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Sắp xếp sản phẩm theo column và direction mới
    this.sortProducts(this.sortColumn, this.sortDirection);
  }

  // Hàm sắp xếp danh sách sản phẩm
  sortProducts(column: string, direction: 'asc' | 'desc'): void {
    this.products = [...this.originalProducts].sort((a, b) => {
      let valueA: any, valueB: any;

      // Xác định giá trị so sánh cho từng loại cột
      switch (column) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'code':
          valueA = a.code;
          valueB = b.code;
          break;
        case 'price':
          valueA = a.numericPrice;
          valueB = b.numericPrice;
          break;
        case 'date':
          valueA = a.timestamp;
          valueB = b.timestamp;
          break;
        default:
          valueA = a[column];
          valueB = b[column];
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

  // Methods for product actions
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
    console.log('Apply filter clicked');
  }

  search(event: any) {
    const searchTerm = event.target.value;
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  }
}
