import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent {
  // Data model for products
  products = [
    {
      id: 1,
      name: 'Phở bò Bình Định',
      code: '20250221P01',
      status: 'Còn hàng',
      price: '120.000đ',
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '21/2/2025',
      image: 'assets/product-placeholder.png',
    },
    {
      id: 2,
      name: 'Cuốn ram Bến Tre',
      code: '20250221P02',
      status: 'Còn hàng',
      price: '120.000đ',
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '21/2/2025',
      image: 'assets/product-placeholder.png',
    },
    {
      id: 3,
      name: 'Bánh canh cua Cần Thơ',
      code: '20250221P03',
      status: 'Còn hàng',
      price: '120.000đ',
      category: 'Miền Trung',
      tags: ['#monnuoc', '#bunbo'],
      date: '21/2/2025',
      image: 'assets/product-placeholder.png',
    },
  ];

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
