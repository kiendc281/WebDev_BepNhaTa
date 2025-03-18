import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/ingredients';

  constructor(private http: HttpClient) {}

  // Lấy tất cả sản phẩm (có thể lọc theo nhiều tiêu chí)
  getAllProducts(filters?: {
    category?: string;
    region?: string;
    status?: string;
    search?: string;
  }): Observable<Product[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.region) params = params.set('region', filters.region);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  // Lấy sản phẩm theo ID
  getProductById(id: string): Observable<{ status: string; data: Product }> {
    return this.http.get<{ status: string; data: Product }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Tạo sản phẩm mới
  createProduct(
    product: Partial<Product>
  ): Observable<{ status: string; data: Product }> {
    return this.http.post<{ status: string; data: Product }>(
      this.apiUrl,
      product
    );
  }

  // Cập nhật sản phẩm
  updateProduct(
    id: string,
    product: Partial<Product>
  ): Observable<{ status: string; data: Product }> {
    return this.http.patch<{ status: string; data: Product }>(
      `${this.apiUrl}/${id}`,
      product
    );
  }

  // Cập nhật số lượng sản phẩm
  updateQuantity(
    id: string,
    quantity: number
  ): Observable<{ status: string; data: Product }> {
    return this.http.patch<{ status: string; data: Product }>(
      `${this.apiUrl}/${id}/quantity`,
      { quantity }
    );
  }

  // Xóa sản phẩm
  deleteProduct(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }
}
