import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
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
          console.log('Raw pricePerPortion:', item.pricePerPortion);

          // Cải thiện xử lý components
          let components: string[] = [];

          if (Array.isArray(item.components)) {
            // Xử lý trường hợp mảng các object hoặc mảng các string
            components = item.components.map((comp: any) => {
              if (typeof comp === 'string') {
                return comp;
              } else if (typeof comp === 'object' && comp !== null) {
                return comp.name || String(comp);
              }
              return String(comp);
            });
          } else if (typeof item.components === 'string') {
            // Nếu components là string, thử phân tích nó thành mảng
            try {
              const parsed = JSON.parse(item.components);
              if (Array.isArray(parsed)) {
                components = parsed.map((comp: any) => {
                  if (typeof comp === 'string') {
                    return comp;
                  } else if (typeof comp === 'object' && comp !== null) {
                    return comp.name || String(comp);
                  }
                  return String(comp);
                });
              } else if (typeof parsed === 'object' && parsed !== null) {
                components = Object.values(parsed).map((c: any) => {
                  if (typeof c === 'string') {
                    return c;
                  } else if (typeof c === 'object' && c !== null) {
                    return c.name || String(c);
                  }
                  return String(c);
                });
              }
            } catch (e) {
              // Nếu không thể parse, xử lý như một chuỗi đơn
              components = [item.components];
            }
          } else if (
            typeof item.components === 'object' &&
            item.components !== null
          ) {
            components = Object.values(item.components).map((c: any) => {
              if (typeof c === 'string') {
                return c;
              } else if (typeof c === 'object' && c !== null) {
                return c.name || String(c);
              }
              return String(c);
            });
          }

          // Log sau khi xử lý
          console.log('Processed components:', components);

          // Xử lý pricePerPortion
          let pricePerPortion: { [key: string]: number } = {};
          let portionQuantities: { [key: string]: number } = {};

          // Kiểm tra xem pricePerPortion có phải là mảng (định dạng mới từ schema cập nhật)
          if (Array.isArray(item.pricePerPortion)) {
            console.log(
              'Xử lý pricePerPortion dạng mảng:',
              item.pricePerPortion
            );

            // Chuyển đổi mảng thành object với key là portion
            item.pricePerPortion.forEach((p: any) => {
              if (p && p.portion && p.price !== undefined) {
                pricePerPortion[p.portion] = p.price;

                // Lưu số lượng nếu có
                if (p.quantity !== undefined) {
                  portionQuantities[p.portion] = p.quantity;
                }
              }
            });
          }
          // Nếu là object (định dạng cũ)
          else if (
            typeof item.pricePerPortion === 'object' &&
            item.pricePerPortion !== null
          ) {
            pricePerPortion = { ...item.pricePerPortion };

            // Chỉ kiểm tra xem có quantity cụ thể cho từng khẩu phần không
            if (
              item.portionQuantities &&
              typeof item.portionQuantities === 'object'
            ) {
              // Nếu backend đã cung cấp thông tin số lượng theo khẩu phần, sử dụng nó
              portionQuantities = { ...item.portionQuantities };
            }
          }

          console.log('Processed pricePerPortion:', pricePerPortion);
          console.log('Backend portionQuantities:', portionQuantities);

          return {
            _id: item._id,
            ingredientName: item.ingredientName,
            mainImage: item.mainImage,
            subImage: item.subImage,
            level: item.level,
            time: item.time,
            combo: item.combo,
            discount: item.discount || 0,
            pricePerPortion: pricePerPortion,
            portionQuantities: portionQuantities,
            pricePerPortionArray: Array.isArray(item.pricePerPortion)
              ? item.pricePerPortion
              : null,
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
      console.warn(
        'Không tìm thấy thông tin giá cho sản phẩm:',
        product?.ingredientName || 'unknown'
      );
      return 0;
    }

    // Kiểm tra xem pricePerPortion có phải là object không
    if (
      typeof product.pricePerPortion !== 'object' ||
      product.pricePerPortion === null
    ) {
      console.error(
        'pricePerPortion không phải là object:',
        product.pricePerPortion
      );
      return 0;
    }

    const price = product.pricePerPortion[portion];
    if (price === undefined) {
      // Nếu không có giá cho khẩu phần yêu cầu
      const availablePortions = Object.keys(product.pricePerPortion);

      // Đặc biệt xử lý cho khẩu phần 4 người
      if (portion === '4' && product.pricePerPortion['2']) {
        // Tính giá cho 4 người dựa trên giá 2 người nhân với hệ số 1.8
        const calculatedPrice = Math.round(product.pricePerPortion['2'] * 1.8);
        console.log(
          `Tính toán giá cho khẩu phần 4 người dựa trên giá 2 người:`,
          calculatedPrice
        );
        return calculatedPrice;
      }

      // Xử lý cho các trường hợp khác
      if (availablePortions.length > 0) {
        const firstAvailablePortion = availablePortions[0];
        console.log(
          `Sử dụng giá của khẩu phần ${firstAvailablePortion} thay thế:`,
          product.pricePerPortion[firstAvailablePortion]
        );
        return product.pricePerPortion[firstAvailablePortion];
      }

      return 0;
    }

    return price;
  }

  getHotProducts(): Observable<Product[]> {
    return this.getProducts().pipe(
      map((products) => {
        // Sort products by rating (rate * count) to get the most popular ones
        return products
          .sort((a, b) => {
            const aScore = (a.rating?.rate || 0) * (a.rating?.count || 0);
            const bScore = (b.rating?.rate || 0) * (b.rating?.count || 0);
            return bScore - aScore;
          })
          .slice(0, 9); // Get top 9 products
      })
    );
  }

  // Tìm gói nguyên liệu liên quan đến công thức
  getProductByRecipeId(recipeId: string): Observable<Product | null> {
    // Đầu tiên lấy thông tin về công thức từ ID
    return this.http
      .get<any>(`http://localhost:3000/api/recipes/${recipeId}`)
      .pipe(
        switchMap((recipe) => {
          if (!recipe) return of(null);

          // Lấy tên của công thức (ví dụ: "Phở bò")
          const recipeName = recipe.recipeName;
          console.log(`Tìm gói nguyên liệu cho công thức: ${recipeName}`);

          // Sau đó tìm sản phẩm phù hợp trong danh sách
          return this.getProducts().pipe(
            map((products) => {
              // Tìm theo hai cách:
              // 1. Kiểm tra ID công thức trong suggestedRecipeIds
              const productByRecipeId = products.find(
                (product) =>
                  Array.isArray(product.suggestedRecipeIds) &&
                  product.suggestedRecipeIds.includes(recipeId)
              );

              if (productByRecipeId) {
                console.log(
                  `Tìm thấy sản phẩm theo ID công thức: ${productByRecipeId.ingredientName}`
                );
                return productByRecipeId;
              }

              // 2. Tìm theo tên sản phẩm và tên công thức
              // Sản phẩm thường được đặt tên dạng "Gói nguyên liệu [Tên món]"
              const productByName = products.find((product) => {
                // Kiểm tra xem tên sản phẩm có chứa tên công thức không
                if (product.ingredientName.includes(recipeName)) {
                  return true;
                }

                // Hoặc ngược lại, kiểm tra xem tên sản phẩm có bắt đầu bằng "Gói nguyên liệu"
                // và sau đó là tên công thức
                const expectedProductName = `Gói nguyên liệu ${recipeName}`;
                return product.ingredientName === expectedProductName;
              });

              if (productByName) {
                console.log(
                  `Tìm thấy sản phẩm theo tên công thức: ${productByName.ingredientName}`
                );
                return productByName;
              }

              console.log(
                `Không tìm thấy gói nguyên liệu cho công thức: ${recipeName}`
              );
              return null;
            })
          );
        })
      );
  }
}
