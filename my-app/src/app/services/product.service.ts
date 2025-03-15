import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.interface'; // Import interface

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/ingredients'; // Chuyển về API đúng

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((data: any[]) => {
        console.log('Raw data from API:', data); // Ghi log dữ liệu thô
        return data.map((item) => {
          const mappedItem = {
            id: item._id || item.id,
            title: item.ingredientName || item.title,
            price: this.getPrice(item),
            description: item.description,
            category: item.category || item.region,
            image: item.mainImage || item.image,
            level: item.level , // Mặc định là 'Trung bình'
            time: item.time , // Mặc định là '25 phút'
            rating: item.rating || { rate: 4.5, count: 10 },
          };
          console.log('Mapped item:', mappedItem); // Ghi log item sau khi chuyển đổi
          return mappedItem;
        });
      })
    );
  }

  // Hàm phụ trợ lấy giá từ cấu trúc pricePerPortion - cải tiến
  private getPrice(item: any): number {
    // Kiểm tra và ghi log để debug
    console.log('Getting price for item:', item);
    
    // Nếu đã có trường price
    if (item.price && typeof item.price === 'number') {
      return item.price;
    }
    
    // Kiểm tra pricePerPortion là mảng và có phần tử
    if (item.pricePerPortion && Array.isArray(item.pricePerPortion) && item.pricePerPortion.length > 0) {
      // Nếu phần tử đầu tiên có trường price
      if (item.pricePerPortion[0].price && typeof item.pricePerPortion[0].price === 'number') {
        return item.pricePerPortion[0].price;
      }
    }
    
    // Giá mặc định nếu không tìm thấy
    return 99000; // Giá mặc định để hiển thị
  }

  // Thêm method để lấy sản phẩm theo category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}?category=${category}`).pipe(
      map((data: any[]) =>
        data.map((item) => ({
          id: item._id || item.id,
          title: item.ingredientName || item.title,
          price: this.getPrice(item),
          description: item.description,
          category: item.category || item.region,
          image: item.mainImage || item.image,
          level: item.level || 'Trung bình', // Mặc định là 'Trung bình'
          time: item.time || '25 phút', // Mặc định là '25 phút'
          rating: item.rating || { rate: 4.5, count: 10 },
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
