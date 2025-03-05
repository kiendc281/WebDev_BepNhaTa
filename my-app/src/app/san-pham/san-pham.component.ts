import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../models/product.interface';

@Component({
  selector: 'app-san-pham',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
        this.updateDisplayedPages();
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
      window.scrollTo(0, 0);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedPages();
      window.scrollTo(0, 0);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedPages();
      window.scrollTo(0, 0);
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
  selectedRegion: string = 'all';

  filterByRegion(region: string): void {
    this.selectedRegion = region;
    this.currentPage = 1;
    this.updateDisplayedPages();
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
        this.products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.products.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        this.products.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        this.products.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        // Reset to original order
        this.loadProducts();
        return;
    }
    this.currentPage = 1;
    this.updateDisplayedPages();
  }
}
