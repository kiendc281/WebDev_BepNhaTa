import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/ingredients';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((response) => {
        console.log('Raw API response:', response);
        if (!Array.isArray(response)) {
          console.warn('Response không phải là mảng:', response);
          return [];
        }

        return response.map((item: any) => {
          // Log để kiểm tra dữ liệu gốc
          console.log('Raw components:', item.components);

          // Đảm bảo components là một mảng
          const components = Array.isArray(item.components)
            ? item.components
            : typeof item.components === 'object' && item.components !== null
            ? Object.values(item.components).map((c) => String(c))
            : [];

          // Log sau khi xử lý
          console.log('Processed components:', components);

          return {
            _id: item._id,
            ingredientName: item.ingredientName,
            mainImage: item.mainImage,
            subImage: item.subImage,
            level: item.level,
            time: item.time,
            combo: item.combo,
            discount: item.discount || 0,
            pricePerPortion: item.pricePerPortion || {},
            description: item.description,
            notes: item.notes,
            components: components,
            storage: item.storage,
            expirationDate: item.expirationDate,
            tags: Array.isArray(item.tags) ? item.tags : [],
            relatedProductIds: Array.isArray(item.relatedProductIds)
              ? item.relatedProductIds
              : [],
            suggestedRecipeIds: Array.isArray(item.suggestedRecipeIds)
              ? item.suggestedRecipeIds
              : [],
            region: item.region,
            category: item.category,
            quantity: item.quantity || 0,
            status: item.status || 'Còn hàng',
            rating: item.rating || { rate: 4.5, count: 10 },
          };
        });
      })
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.getProducts().pipe(
      map((products) =>
        products.filter((product) => product.category === category)
      )
    );
  }

  getRelatedProducts(
    category: string,
    currentProductId: string
  ): Observable<Product[]> {
    return this.getProducts().pipe(
      map((products) =>
        products
          .filter(
            (product) =>
              product._id !== currentProductId && product.category === category
          )
          .slice(0, 4)
      )
    );
  }

  calculateDiscountedPrice(product: Product, portion: string = '2'): number {
    const originalPrice = this.getPortionPrice(product, portion);
    if (!product.discount || product.discount <= 0) {
      return originalPrice;
    }
    return originalPrice * (1 - product.discount / 100);
  }

  getPortionPrice(product: Product, portion: string = '2'): number {
    if (!product || !product.pricePerPortion) {
      console.warn('Không tìm thấy thông tin giá cho sản phẩm:', product);
      return 0;
    }

    const price = product.pricePerPortion[portion];
    if (price === undefined) {
      console.warn(
        `Không tìm thấy giá cho khẩu phần ${portion} người:`,
        product.pricePerPortion
      );
      // Nếu không có giá cho khẩu phần 4 người, tính dựa trên giá 2 người
      if (portion === '4' && product.pricePerPortion['2']) {
        return Math.round(product.pricePerPortion['2'] * 1.8);
      }
      return 0;
    }

    return price;
  }
}
