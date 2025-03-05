import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.interface'; // Import interface

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'https://fakestoreapi.com/products'; // API của FakeStoreAPI

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((data: any[]) =>
        data.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          description: item.description,
          category: item.category,
          image: item.image,
          rating: item.rating,
        }))
      )
    );
  }

  // Thêm method để lấy sản phẩm theo category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/${category}`).pipe(
      map((data: any[]) =>
        data.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          description: item.description,
          category: item.category,
          image: item.image,
          rating: item.rating,
        }))
      )
    );
  }

  // Thêm method để lấy sản phẩm liên quan (cùng category, trừ sản phẩm hiện tại)
  getRelatedProducts(
    category: string,
    currentProductId: number
  ): Observable<Product[]> {
    return this.getProductsByCategory(category).pipe(
      map((products) =>
        products
          .filter((product) => product.id !== currentProductId)
          .slice(0, 4)
      )
    );
  }
}
