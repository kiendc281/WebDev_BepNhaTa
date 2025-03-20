import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Product } from '../models/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/ingredients';
  private requestTimeout = 120000; // 2 phút

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

    return this.http
      .get<Product[]>(this.apiUrl, { params })
      .pipe(timeout(this.requestTimeout));
  }

  // Lấy sản phẩm theo ID
  getProductById(id: string): Observable<{ status: string; data: Product }> {
    return this.http
      .get<{ status: string; data: Product }>(`${this.apiUrl}/${id}`)
      .pipe(timeout(this.requestTimeout));
  }

  // Tạo sản phẩm mới
  createProduct(
    product: Partial<Product>
  ): Observable<{ status: string; data: Product }> {
    if (!product) {
      throw new Error('Dữ liệu sản phẩm không được để trống');
    }

    // Sử dụng JSON trực tiếp thay vì FormData
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http
      .post<{ status: string; data: Product }>(this.apiUrl, product, {
        headers,
      })
      .pipe(timeout(this.requestTimeout));
  }

  // Cập nhật sản phẩm
  updateProduct(
    id: string,
    product: Partial<Product>
  ): Observable<{ status: string; data: Product }> {
    if (!id) {
      throw new Error('ID sản phẩm không được để trống');
    }

    if (!product) {
      throw new Error('Dữ liệu sản phẩm không được để trống');
    }

    // Sử dụng JSON trực tiếp thay vì FormData
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http
      .patch<{ status: string; data: Product }>(
        `${this.apiUrl}/${id}`,
        product,
        { headers }
      )
      .pipe(timeout(this.requestTimeout));
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
