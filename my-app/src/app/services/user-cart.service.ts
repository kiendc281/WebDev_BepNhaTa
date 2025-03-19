import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { CartItem, Cart } from '../models/cart.interface';
import { Product } from '../models/product.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserCartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('UserCartService khởi tạo với URL API:', this.apiUrl);
  }

  /**
   * Lấy ID của người dùng hiện tại
   */
  getUserId(): string | null {
    const user = this.authService.getCurrentUser();
    console.log('Current user from localStorage:', user);
    
    if (!user) {
      console.log('User not logged in');
      return null;
    }

    // Ưu tiên sử dụng _id trước, nếu không có thì dùng id
    let userId = user._id || user.id;
    
    if (!userId) {
      console.log('No valid ID found in user object');
      return null;
    }

    // Đảm bảo ID là string
    userId = String(userId);
    
    console.log('Using userId:', userId);
    return userId;
  }

  /**
   * Lấy token xác thực
   */
  getAuthHeaders(): HttpHeaders | null {
    const token = this.authService.getToken();
    if (!token) {
      console.error('Không tìm thấy token xác thực!');
      return null;
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Tải giỏ hàng từ server
   */
  loadCart(): Observable<Cart> {
    console.log('Đang tải giỏ hàng người dùng...');
    this.loadingSubject.next(true);
    
    // Lấy userId từ phương thức getUserId của service này
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không có ID người dùng');
      this.loadingSubject.next(false);
      return throwError(() => new Error('Không tìm thấy ID người dùng'));
    }
    
    const url = `${this.apiUrl}/account/${userId}`;
    console.log(`Gọi API lấy giỏ hàng: ${url}`);
    
    return this.http.get<any>(url).pipe(
      map(response => this.mapCartData(response)),
      tap(cart => {
        console.log('Đã tải giỏ hàng từ server:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Lỗi khi tải giỏ hàng từ server:', error);
        return throwError(() => new Error('Không thể tải giỏ hàng từ server'));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Thêm sản phẩm vào giỏ hàng server
   */
  addToCart(product: Product, quantity: number, servingSize: string, price: number): Observable<Cart> {
    console.log('Thêm vào giỏ hàng server:', { 
      productId: product._id, 
      productName: product.ingredientName,
      quantity, 
      servingSize, 
      price 
    });
    
    // Kiểm tra đầu vào
    if (!product || !product._id) {
      console.error('Không có thông tin sản phẩm:', product);
      return throwError(() => new Error('Không có thông tin sản phẩm'));
    }
    
    if (quantity <= 0) {
      console.error('Số lượng không hợp lệ:', quantity);
      return throwError(() => new Error('Số lượng sản phẩm phải lớn hơn 0'));
    }
    
    if (!servingSize) {
      console.error('Không có thông tin khẩu phần:', servingSize);
      return throwError(() => new Error('Không có thông tin khẩu phần'));
    }
    
    // Lấy userId từ phương thức getUserId của service này
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không có ID người dùng');
      return throwError(() => new Error('Không tìm thấy ID người dùng'));
    }
    
    this.loadingSubject.next(true);
    
    const payload = {
      userId,
      productId: product._id,
      quantity,
      servingSize,
      price
    };
    
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    console.log('Gửi payload đến server:', payload);

    return this.http.post<any>(`${this.apiUrl}/add-item`, payload, { headers }).pipe(
      map(response => this.mapCartData(response)),
      tap(cart => {
        console.log('Đã thêm sản phẩm vào giỏ hàng server thành công:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng server:', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng'));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng server
   */
  updateQuantity(productId: string, servingSize: string, quantity: number): Observable<Cart> {
    console.log('Cập nhật số lượng trong giỏ hàng server:', { productId, servingSize, quantity });
    
    // Kiểm tra đầu vào
    if (!productId) {
      console.error('Không có ID sản phẩm');
      return throwError(() => new Error('Không có ID sản phẩm'));
    }
    
    if (!servingSize) {
      console.error('Không có thông tin khẩu phần');
      return throwError(() => new Error('Không có thông tin khẩu phần'));
    }
    
    if (quantity <= 0) {
      console.error('Số lượng không hợp lệ:', quantity);
      return throwError(() => new Error('Số lượng sản phẩm phải lớn hơn 0'));
    }
    
    // Lấy userId từ phương thức getUserId của service này
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không có ID người dùng');
      return throwError(() => new Error('Không tìm thấy ID người dùng'));
    }
    
    this.loadingSubject.next(true);
    
    // Lấy thông tin giỏ hàng hiện tại để lấy giá sản phẩm
    const currentCart = this.getCurrentCart();
    const cartItem = currentCart.items.find(item => 
      item.productId === productId && item.servingSize === servingSize
    );
    
    if (!cartItem) {
      console.error('Không tìm thấy sản phẩm trong giỏ hàng');
      this.loadingSubject.next(false);
      return throwError(() => new Error('Không tìm thấy sản phẩm trong giỏ hàng'));
    }
    
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    // Giải pháp: Xóa sản phẩm trước, sau đó thêm lại với số lượng mới
    // Bước 1: Tạo payload để xóa sản phẩm
    const removePayload = {
      userId,
      productId,
      servingSize
    };
    
    console.log('Bước 1: Xóa sản phẩm hiện tại khỏi giỏ hàng:', removePayload);
    
    // Bước 2: Tạo payload để thêm lại sản phẩm với số lượng mới
    const addPayload = {
      userId,
      productId,
      servingSize,
      quantity,
      price: cartItem.price  // Giữ nguyên giá hiện tại
    };
    
    console.log('Bước 2: Thêm lại sản phẩm với số lượng chính xác:', addPayload);
    
    // Thực hiện hai thao tác tuần tự: xóa rồi thêm lại
    return this.http.post<any>(`${this.apiUrl}/remove-item`, removePayload, { headers }).pipe(
      switchMap(() => {
        return this.http.post<any>(`${this.apiUrl}/add-item`, addPayload, { headers });
      }),
      map(response => this.mapCartData(response)),
      tap(cart => {
        console.log('Đã cập nhật số lượng sản phẩm thành công:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
        return throwError(() => new Error('Không thể cập nhật số lượng sản phẩm: ' + (error.error?.message || 'Vui lòng thử lại')));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng server
   */
  removeFromCart(productId: string, servingSize: string): Observable<Cart> {
    console.log('Xóa sản phẩm khỏi giỏ hàng server:', { productId, servingSize });
    
    // Kiểm tra đầu vào
    if (!productId) {
      console.error('Không có ID sản phẩm');
      return throwError(() => new Error('Không có ID sản phẩm'));
    }
    
    if (!servingSize) {
      console.error('Không có thông tin khẩu phần');
      return throwError(() => new Error('Không có thông tin khẩu phần'));
    }
    
    // Lấy userId từ phương thức getUserId của service này
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không có ID người dùng');
      return throwError(() => new Error('Không tìm thấy ID người dùng'));
    }
    
    this.loadingSubject.next(true);
    
    // Tạo payload cho request
    const payload = {
      userId,
      productId,
      servingSize
    };
    
    console.log('Payload xóa sản phẩm:', payload);
    
    // Gửi request POST thay vì DELETE vì server API có thể không hỗ trợ DELETE
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/remove-item`, payload, { headers }).pipe(
      map(response => this.mapCartData(response)),
      tap(cart => {
        console.log('Đã xóa sản phẩm khỏi giỏ hàng thành công:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        return throwError(() => new Error('Không thể xóa sản phẩm khỏi giỏ hàng: ' + (error.error?.message || 'Vui lòng thử lại')));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Xóa toàn bộ giỏ hàng server
   */
  clearCart(): Observable<Cart> {
    console.log('Xóa toàn bộ giỏ hàng server');
    
    // Lấy userId từ phương thức getUserId của service này
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không có ID người dùng');
      return throwError(() => new Error('Không tìm thấy ID người dùng'));
    }
    
    this.loadingSubject.next(true);
    
    // Sử dụng HttpParams để tạo query string
    const params = { userId };
    
    return this.http.delete<any>(`${this.apiUrl}/clear`, { params }).pipe(
      map(response => this.mapCartData(response)),
      tap(cart => {
        console.log('Đã xóa toàn bộ giỏ hàng thành công');
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Lỗi khi xóa toàn bộ giỏ hàng:', error);
        return throwError(() => new Error('Không thể xóa toàn bộ giỏ hàng'));
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Lấy giỏ hàng hiện tại từ service
   */
  getCurrentCart(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Cập nhật giỏ hàng hiện tại
   */
  updateCart(cart: Cart): void {
    this.cartSubject.next(cart);
    this.cartItems.next(cart.items || []);
  }

  /**
   * Hợp nhất giỏ hàng cục bộ với giỏ hàng server khi đăng nhập
   */
  mergeCartsAfterLogin(localCart: Cart): Observable<Cart> {
    console.log('Bắt đầu hợp nhất giỏ hàng cục bộ với server sau đăng nhập...');
    this.loadingSubject.next(true);
    
    const userId = this.getUserId();
    if (!userId) {
      console.error('Không thể hợp nhất giỏ hàng: Không tìm thấy userId');
      this.loadingSubject.next(false);
      return throwError(() => new Error('Không tìm thấy userId'));
    }

    const headers = this.getAuthHeaders();
    if (!headers) {
      this.loadingSubject.next(false);
      return throwError(() => new Error('Không tìm thấy token xác thực'));
    }

    // Chỉ tải giỏ hàng từ server, bỏ qua giỏ hàng cục bộ hoàn toàn
    console.log('Đăng nhập thành công: Bỏ qua giỏ hàng cục bộ, chỉ tải giỏ hàng người dùng từ server');
    return this.loadCart().pipe(
      tap(serverCart => {
        console.log('Đã tải giỏ hàng người dùng từ server:', serverCart);
        this.cartSubject.next(serverCart);
        this.cartItems.next(serverCart.items || []);
      }),
      catchError(error => {
        console.error('Lỗi khi tải giỏ hàng người dùng từ server:', error);
        
        // Nếu giỏ hàng không tồn tại (404), tạo giỏ hàng mới rỗng
        if (error.status === 404) {
          console.log('Giỏ hàng server không tồn tại (404), tạo mới giỏ hàng rỗng');
          const emptyCart: Cart = { items: [], totalQuantity: 0, totalPrice: 0 };
          this.cartSubject.next(emptyCart);
          this.cartItems.next([]);
          return of(emptyCart);
        }
        
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Debug giỏ hàng server
   */
  debugCart(): void {
    console.log('===== DEBUG SERVER CART STATE =====');
    console.log('Current server cart:', this.cartSubject.value);
    
    const userId = this.getUserId();
    if (!userId) {
      console.log('Không tìm thấy userId để debug giỏ hàng server');
      return;
    }
    
    const headers = this.getAuthHeaders();
    if (!headers) {
      console.log('Không tìm thấy token xác thực để debug giỏ hàng server');
      return;
    }
    
    const url = `${environment.apiUrl}/cart/account/${userId}`;
    console.log(`Debug giỏ hàng, URL: ${url}`);
    
    this.http.get<Cart>(url, { headers }).subscribe({
      next: cart => {
        console.log('Giỏ hàng từ server:', cart);
        console.log('Tổng số sản phẩm:', cart.totalQuantity);
        console.log('Tổng tiền:', cart.totalPrice);
      },
      error: error => {
        console.error('Lỗi khi tải giỏ hàng từ server cho debug:', error);
      }
    });
    
    console.log('===========================');
  }

  /**
   * Ánh xạ dữ liệu giỏ hàng từ định dạng API sang định dạng ứng dụng
   */
  private mapCartData(cartData: any): Cart {
    if (!cartData) {
      return { items: [], totalQuantity: 0, totalPrice: 0 };
    }
    
    let cartItems: CartItem[] = [];
    
    if (cartData.items && Array.isArray(cartData.items)) {
      cartItems = cartData.items.map((item: any) => {
        // Xử lý trường hợp item.productId có thể là object từ populate hoặc string ID
        const productData = typeof item.productId === 'object' && item.productId !== null 
          ? item.productId 
          : null;
        
        return {
          productId: productData?._id || item.productId,
          productName: productData?.ingredientName || item.ingredientName,
          ingredientName: productData?.ingredientName || item.ingredientName,
          mainImage: productData?.mainImage || item.mainImage,
          quantity: item.quantity,
          servingSize: item.servingSize,
          price: item.price,
          selected: item.selected !== undefined ? item.selected : false // Đảm bảo thuộc tính selected luôn tồn tại
        };
      });
    }
    
    return {
      items: cartItems,
      totalQuantity: cartData.totalQuantity || 0,
      totalPrice: cartData.totalPrice || 0
    };
  }
} 