import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { Cart, CartItem } from '../models/cart.interface';
import { Product } from '../models/product.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GuestCartService {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor(private http: HttpClient) {
    console.log('GuestCartService khởi tạo');
    // Khởi tạo giỏ hàng từ localStorage khi khởi động service
    this.loadLocalCart();
  }

  /**
   * Tải giỏ hàng từ localStorage
   */
  loadLocalCart(): void {
    console.log('Tải giỏ hàng từ localStorage');
    const cart = this.getLocalCart();
    this.cartSubject.next(cart);
    this.cartItems.next(cart.items || []);
  }

  /**
   * Lấy giỏ hàng từ localStorage
   */
  getLocalCart(): Cart {
    console.log('Lấy giỏ hàng từ localStorage');
    try {
      const cartStr = localStorage.getItem('cart');
      if (cartStr) {
        const cart = JSON.parse(cartStr);
        
        // Đảm bảo tất cả các sản phẩm trong giỏ hàng đều có thuộc tính ingredientName
        if (cart.items && Array.isArray(cart.items)) {
          cart.items = cart.items.map((item: any) => {
            // Nếu không có ingredientName, sử dụng productName
            if (!item.ingredientName && item.productName) {
              return { ...item, ingredientName: item.productName };
            }
            return item;
          });
        }
        
        return cart;
      }
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng từ localStorage:', error);
    }
    return { items: [], totalQuantity: 0, totalPrice: 0 };
  }

  /**
   * Lưu giỏ hàng vào localStorage
   */
  saveLocalCart(cart: Cart): void {
    console.log('Lưu giỏ hàng vào localStorage:', cart);
    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartSubject.next(cart);
    this.cartItems.next(cart.items || []);
  }

  /**
   * Thêm sản phẩm vào giỏ hàng cục bộ
   */
  addToLocalCart(product: Product, quantity: number, servingSize: string, price: number): void {
    console.log('Thêm vào giỏ hàng cục bộ:', { product, quantity, servingSize, price });
    
    // Kiểm tra đầu vào
    if (!product._id || !quantity || !servingSize || !price) {
      console.error('Thiếu thông tin bắt buộc:', { productId: product._id, quantity, servingSize, price });
      return;
    }
    
    const cart = this.getLocalCart();
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === product._id && item.servingSize === servingSize
    );
    
    if (existingItemIndex > -1) {
      // Cập nhật số lượng nếu sản phẩm đã tồn tại
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Thêm sản phẩm mới
      cart.items.push({
        productId: product._id,
        productName: product.ingredientName,
        ingredientName: product.ingredientName,
        mainImage: product.mainImage,
        quantity,
        servingSize,
        price,
        selected: false
      });
    }
    
    const updatedCart = this.calculateCartTotals(cart.items);
    this.saveLocalCart(updatedCart);
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng cục bộ
   */
  updateQuantity(productId: string, servingSize: string, quantity: number): void {
    console.log('Cập nhật số lượng sản phẩm cục bộ:', { productId, servingSize, quantity });
    
    if (quantity <= 0) {
      this.removeFromCart(productId, servingSize);
      return;
    }
    
    const cart = this.getLocalCart();
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId && item.servingSize === servingSize
    );
    
    if (existingItemIndex > -1) {
      // Giữ lại đối tượng item cũ và chỉ cập nhật thuộc tính quantity
      const updatedItem = { ...cart.items[existingItemIndex], quantity };
      
      // Tạo mảng items mới với thứ tự không thay đổi
      const newItems = [...cart.items];
      newItems[existingItemIndex] = updatedItem;
      
      const updatedCart = this.calculateCartTotals(newItems);
      this.saveLocalCart(updatedCart);
    } else {
      console.warn('Không tìm thấy sản phẩm trong giỏ hàng cục bộ:', { productId, servingSize });
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng cục bộ
   */
  removeFromCart(productId: string, servingSize: string): void {
    console.log('Xóa sản phẩm khỏi giỏ hàng cục bộ:', { productId, servingSize });
    
    const cart = this.getLocalCart();
    // Lọc ra sản phẩm cần xóa nhưng giữ nguyên thứ tự các sản phẩm khác
    const updatedItems = cart.items.filter(
      item => !(item.productId === productId && item.servingSize === servingSize)
    );
    
    const updatedCart = this.calculateCartTotals(updatedItems);
    this.saveLocalCart(updatedCart);
  }

  /**
   * Xóa toàn bộ giỏ hàng cục bộ
   */
  clearCart(): void {
    console.log('Xóa toàn bộ giỏ hàng cục bộ');
    
    const emptyCart = { items: [], totalQuantity: 0, totalPrice: 0 };
    this.saveLocalCart(emptyCart);
  }

  /**
   * Tính tổng số lượng và giá trị giỏ hàng
   */
  calculateCartTotals(items: CartItem[]): Cart {
    console.log('Tính tổng số lượng và giá trị giỏ hàng cục bộ');
    
    let totalQuantity = 0;
    let totalPrice = 0;
    
    items.forEach(item => {
      totalQuantity += item.quantity;
      totalPrice += item.quantity * item.price;
    });
    
    // Đảm bảo không thay đổi cấu trúc của items
    return {
      items: [...items],
      totalQuantity,
      totalPrice
    };
  }

  /**
   * Lấy giỏ hàng hiện tại từ service
   */
  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Debug giỏ hàng
   */
  debugCart(): void {
    console.log('===== DEBUG LOCAL CART STATE =====');
    console.log('Giỏ hàng hiện tại trong service:', this.cartSubject.value);
    
    const savedCart = localStorage.getItem('cart');
    console.log('Giỏ hàng trong localStorage:', savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Đã parse giỏ hàng từ localStorage:', parsedCart);
        console.log('Tổng số sản phẩm:', parsedCart.totalQuantity);
        console.log('Tổng tiền:', parsedCart.totalPrice);
      } catch (e) {
        console.error('Lỗi khi parse giỏ hàng từ localStorage:', e);
      }
    }
    
    console.log('===========================');
  }

  /**
   * Cập nhật số lượng nguyên liệu sau khi đặt hàng thành công
   * @param orderId - ID của đơn hàng mới tạo
   * @param orderItems - Các sản phẩm trong đơn hàng
   */
  updateInventoryAfterOrder(orderId: string, orderItems: CartItem[]): Observable<any> {
    console.log('===== BẮT ĐẦU CẬP NHẬT KHO TỪ FRONTEND =====');
    console.log('📦 Cập nhật số lượng nguyên liệu sau khi đặt hàng thành công:', { orderId, orderItems });
    
    if (!orderId) {
      console.error('❌ Thiếu orderId để cập nhật kho!');
      return of({ status: 'error', message: 'Thiếu orderId để cập nhật kho' });
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.error('❌ Không có sản phẩm để cập nhật kho!');
      return of({ status: 'error', message: 'Không có sản phẩm để cập nhật kho' });
    }
    
    // Log chi tiết từng sản phẩm để kiểm tra
    console.log('📋 DANH SÁCH SẢN PHẨM CẦN CẬP NHẬT KHO:');
    orderItems.forEach((item, index) => {
      console.log(`🔸 Sản phẩm #${index + 1}: ${item.productName || item.ingredientName || 'Không có tên'}`, {
        productId: item.productId,
        quantity: item.quantity,
        servingSize: item.servingSize || 'Không có',
        price: item.price
      });
      
      // Chuẩn hóa servingSize để tránh không khớp
      if (item.servingSize) {
        console.log(`   - ServingSize gốc: "${item.servingSize}"`);
      }
      
      // Kiểm tra dữ liệu
      if (!item.productId) {
        console.error(`❌ Sản phẩm #${index + 1} thiếu productId!`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        console.error(`❌ Sản phẩm #${index + 1} có số lượng không hợp lệ: ${item.quantity}`);
      }
    });
    
    // Lọc bỏ các sản phẩm không hợp lệ
    const validItems = orderItems.filter(item => 
      item.productId && item.quantity && item.quantity > 0
    );
    
    if (validItems.length === 0) {
      console.error('❌ Không có sản phẩm hợp lệ để cập nhật kho!');
      return of({ status: 'error', message: 'Không có sản phẩm hợp lệ để cập nhật kho' });
    }
    
    // Chuẩn bị dữ liệu cập nhật kho
    const inventoryUpdateData = validItems.map(item => {
      // Chuẩn hóa servingSize 
      let normalizedServingSize = item.servingSize || 'Mặc định';
      
      // Xử lý đặc biệt cho bún thang
      const productName = (item.productName || item.ingredientName || '').toLowerCase();
      console.log(`\n🔍 Xử lý sản phẩm: ${productName}`);
      
      if (productName.includes('bún thang') || productName.includes('bun thang')) {
        console.log(`   ⭐ Phát hiện sản phẩm bún thang, áp dụng xử lý đặc biệt cho servingSize: ${normalizedServingSize}`);
        
        // Trích xuất số từ servingSize
        const numMatch = normalizedServingSize.match(/(\d+)/);
        if (numMatch) {
          const originalValue = normalizedServingSize;
          normalizedServingSize = numMatch[1]; // Chỉ giữ lại phần số
          console.log(`   ✅ Đã chuẩn hóa servingSize cho bún thang: "${originalValue}" -> "${normalizedServingSize}"`);
        }
      } else {
        console.log(`   📝 Xử lý sản phẩm thông thường: "${productName}" với servingSize: "${normalizedServingSize}"`);
        
        // Kiểm tra nếu servingSize chỉ chứa số
        if (/^\d+$/.test(normalizedServingSize)) {
          console.log(`   ⚠️ Phát hiện servingSize chỉ có số: "${normalizedServingSize}"`);
        }
      }
      
      // Đảm bảo servingSize hợp lệ
      normalizedServingSize = normalizedServingSize.trim();
      
      const itemData = {
        productId: item.productId,
        quantity: item.quantity,
        servingSize: normalizedServingSize
      };
      
      console.log(`   📤 Dữ liệu gửi đi: Sản phẩm=${productName}, SL=${item.quantity}, ServingSize="${normalizedServingSize}"`);
      return itemData;
    });
    
    console.log('\n📦 TÓM TẮT DỮ LIỆU GỬI ĐI:', {
      orderId,
      items: inventoryUpdateData.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        servingSize: item.servingSize
      }))
    });
    
    // Gọi API cập nhật kho
    const endpoint = `${environment.apiUrl}/ingredients/update-inventory`;
    console.log('🔗 Gọi API endpoint:', endpoint);
    
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    return this.http.post(endpoint, {
      orderId,
      items: inventoryUpdateData
    }, { headers }).pipe(
      tap(response => {
        console.log('✅ ĐÃ CẬP NHẬT SỐ LƯỢNG THÀNH CÔNG:', response);
        console.log('===== KẾT THÚC CẬP NHẬT KHO TỪ FRONTEND =====');
      }),
      catchError(error => {
        console.error('❌ LỖI KHI CẬP NHẬT SỐ LƯỢNG:', error);
        if (error.error) {
          console.error('   Chi tiết lỗi:', error.error);
        }
        console.log('===== KẾT THÚC CẬP NHẬT KHO TỪ FRONTEND (THẤT BẠI) =====');
        // Không ảnh hưởng đến luồng đặt hàng, chỉ log lỗi
        return of({ status: 'warning', message: 'Đặt hàng thành công nhưng cập nhật kho thất bại' });
      })
    );
  }
} 