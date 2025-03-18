import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap, catchError, throwError, finalize, switchMap } from 'rxjs';
import { CartItem, Cart } from '../models/cart.interface';
import { Product } from '../models/product.interface';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private checkAuthInterval: any;
  private previousLoginState: boolean = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Kiểm tra trạng thái đăng nhập ban đầu
    this.previousLoginState = this.authService.isLoggedIn();
    
    // Khởi tạo giỏ hàng
    this.loadCart();
    console.log('CartService khởi tạo với URL API:', this.apiUrl);
    
    // Kiểm tra trạng thái đăng nhập mỗi giây
    this.checkAuthInterval = setInterval(() => {
      const currentLoginState = this.authService.isLoggedIn();
      
      // Nếu trạng thái đăng nhập thay đổi
      if (currentLoginState !== this.previousLoginState) {
        console.log('Trạng thái đăng nhập thay đổi:', 
                    this.previousLoginState ? 'Đăng xuất' : 'Đăng nhập');
        
        // Cập nhật trạng thái đăng nhập
        this.previousLoginState = currentLoginState;
        
        if (currentLoginState) {
          // Vừa đăng nhập: đồng bộ giỏ hàng với server
          console.log('Đăng nhập: đồng bộ giỏ hàng với server');
          this.mergeCartsAfterLogin().subscribe();
        } else {
          // Vừa đăng xuất: reset giỏ hàng
          console.log('Đăng xuất: reset giỏ hàng');
          this.resetCart();
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.checkAuthInterval) {
      clearInterval(this.checkAuthInterval);
    }
  }

  get cartItems$(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  private getUserId(): string | null {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
    const userId = user?.id || user?._id;
    if (!userId) {
      console.log('User not logged in or no valid ID');
      return null;
    }
    return userId;
  }

  private getLocalCart(): Cart {
    const localCartString = localStorage.getItem('cart');
    if (localCartString) {
      try {
        return JSON.parse(localCartString);
      } catch (e) {
        console.error('Error parsing local cart:', e);
      }
    }
    return { items: [], totalQuantity: 0, totalPrice: 0 };
  }

  private saveLocalCart(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
    this.cartSubject.next(cart);
    this.cartItems.next(cart.items);
  }

  /**
   * Reset cart when user logs out
   */
  resetCart(): void {
    console.log('Resetting cart...');
    const emptyCart = { items: [], totalQuantity: 0, totalPrice: 0 };
    this.cartSubject.next(emptyCart);
    this.cartItems.next([]);
    localStorage.removeItem('cart');
    console.log('Cart has been reset');
  }

  /**
   * Loads the cart based on authentication status
   */
  loadCart(): Observable<Cart> {
    this.loadingSubject.next(true);
    const userId = this.getUserId();

    if (!userId) {
      // Nếu không đăng nhập, load từ localStorage
      const localCart = this.getLocalCart();
      this.cartSubject.next(localCart);
      this.cartItems.next(localCart.items);
      this.loadingSubject.next(false);
      return of(localCart);
    }

    // Nếu đã đăng nhập, load từ server
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<Cart>(`${environment.apiUrl}/cart/user?userId=${userId}`, { headers }).pipe(
      tap(cart => {
        console.log('Loaded cart from server:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error loading cart:', error);
        const localCart = this.getLocalCart();
        this.cartSubject.next(localCart);
        this.cartItems.next(localCart.items);
        this.loadingSubject.next(false);
        return of(localCart); // Fallback to local cart if server fails
      })
    );
  }

  /**
   * Adds a product to the cart
   */
  addToCart(product: Product, quantity: number, servingSize: string, price: number): Observable<Cart> {
    const userId = this.getUserId();

    // Ensure all required fields are present
    if (!product._id || !quantity || !servingSize || !price) {
      console.error('Missing required fields:', { productId: product._id, quantity, servingSize, price });
      return throwError(() => new Error('Missing required fields'));
    }

    if (!userId) {
      // Xử lý thêm vào giỏ hàng local nếu chưa đăng nhập
      console.log('Adding to local cart as guest');
      const localCart = this.getLocalCart();
      const existingItemIndex = localCart.items.findIndex(
        item => item.productId === product._id && item.servingSize === servingSize
      );

      if (existingItemIndex > -1) {
        // Cập nhật số lượng nếu sản phẩm đã tồn tại
        localCart.items[existingItemIndex].quantity += quantity;
      } else {
        // Thêm sản phẩm mới
        localCart.items.push({
          productId: product._id,
          ingredientName: product.ingredientName,
          mainImage: product.mainImage,
          quantity,
          servingSize,
          price
        });
      }

      const updatedCart = this.calculateCartTotals(localCart.items);
      this.saveLocalCart(updatedCart);
      return of(updatedCart);
    }

    // Xử lý thêm vào giỏ hàng server nếu đã đăng nhập
    // Kiểm tra cấu trúc payload theo yêu cầu của backend
    const payload = {
      userId: userId,
      item: {
        productId: product._id,
        quantity: quantity,
        servingSize: servingSize,
        price: price
      }
    };

    console.log('Adding to server cart with payload:', payload);

    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Gửi request đến endpoint API chính xác
    return this.http.post<Cart>(`${environment.apiUrl}/cart/add-item`, payload, { headers }).pipe(
      tap(cart => {
        console.log('Cart updated successfully:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Error adding to cart:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Failed to add item to cart'));
      })
    );
  }

  /**
   * Updates the quantity of an item in the cart
   */
  updateQuantity(productId: string, servingSize: string, quantity: number): Observable<Cart> {
    const userId = this.getUserId();

    if (!userId) {
      // Cập nhật giỏ hàng local nếu chưa đăng nhập
      console.log('Updating local cart quantity as guest');
      const localCart = this.getLocalCart();
      const updatedItems = localCart.items.map(item => {
        if (item.productId === productId && item.servingSize === servingSize) {
          return { ...item, quantity };
        }
        return item;
      });

      const updatedCart = this.calculateCartTotals(updatedItems);
      this.saveLocalCart(updatedCart);
      return of(updatedCart);
    }

    // Cập nhật giỏ hàng server nếu đã đăng nhập
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const payload = {
      userId: userId,
      item: {
        productId: productId,
        servingSize: servingSize,
        quantity: quantity
      }
    };

    console.log('Updating server cart quantity with payload:', payload);

    return this.http.post<Cart>(`${environment.apiUrl}/cart/update-item`, payload, { headers }).pipe(
      tap(cart => {
        console.log('Cart updated successfully:', cart);
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        console.error('Error updating quantity:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Failed to update quantity'));
      })
    );
  }

  /**
   * Removes an item from the cart
   */
  removeFromCart(productId: string, servingSize: string): Observable<Cart> {
    const userId = this.getUserId();

    if (!userId) {
      // Xóa khỏi giỏ hàng local nếu chưa đăng nhập
      console.log('Removing from local cart as guest');
      const localCart = this.getLocalCart();
      const updatedItems = localCart.items.filter(
        item => !(item.productId === productId && item.servingSize === servingSize)
      );
      const updatedCart = this.calculateCartTotals(updatedItems);
      this.saveLocalCart(updatedCart);
      return of(updatedCart);
    }

    // Xóa khỏi giỏ hàng server nếu đã đăng nhập
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const payload = {
      userId: userId,
      productId: productId,
      servingSize: servingSize
    };

    return this.http.post<Cart>(`${environment.apiUrl}/cart/remove-item`, payload, { headers }).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Clears the entire cart
   */
  clearCart(): Observable<Cart> {
    const userId = this.getUserId();
    const emptyCart = { items: [], totalQuantity: 0, totalPrice: 0 };

    if (!userId) {
      // Xóa giỏ hàng local nếu chưa đăng nhập
      this.saveLocalCart(emptyCart);
      return of(emptyCart);
    }

    // Xóa giỏ hàng server nếu đã đăng nhập
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.delete<Cart>(`${environment.apiUrl}/cart/clear?userId=${userId}`, { headers }).pipe(
      tap(cart => {
        this.cartSubject.next(cart);
        this.cartItems.next(cart.items);
      }),
      catchError(error => {
        this.saveLocalCart(emptyCart);
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.error?.message || 'Something went wrong'));
  }

  /**
   * Merges local cart with server cart when user logs in
   */
  mergeCartsAfterLogin(): Observable<Cart> {
    console.log('Bắt đầu đồng bộ giỏ hàng sau đăng nhập...');
    this.loadingSubject.next(true);
    
    const userId = this.getUserId();
    const token = this.authService.getToken();
    
    if (!token || !userId) {
      console.error('Không thể đồng bộ giỏ hàng: Không tìm thấy token hoặc userId');
      this.loadingSubject.next(false);
      return throwError(() => new Error('Không tìm thấy token hoặc userId'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    // Lấy giỏ hàng từ server
    return this.http.get<Cart>(`${environment.apiUrl}/cart/user?userId=${userId}`, { headers }).pipe(
      tap(serverCart => {
        console.log('Giỏ hàng từ server:', serverCart);
        // Cập nhật giỏ hàng trong service
        this.cartSubject.next(serverCart);
        this.cartItems.next(serverCart.items);
        // Xóa giỏ hàng local sau khi đồng bộ thành công
        localStorage.removeItem('cart');
      }),
      catchError(error => {
        console.error('Lỗi khi lấy giỏ hàng từ server:', error);
        // Nếu có lỗi, giữ lại giỏ hàng local
        const localCart = this.getLocalCart();
        this.cartSubject.next(localCart);
        this.cartItems.next(localCart.items);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Calculates cart totals (total quantity and price)
   */
  private calculateCartTotals(items: CartItem[]): Cart {
    console.log('Tính toán tổng giỏ hàng cho items:', items);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cart = { items, totalQuantity, totalPrice };
    console.log('Kết quả tính toán cart:', cart);
    return cart;
  }

  /**
   * Debug method to check current cart state
   */
  debugCart(): void {
    const currentCart = this.cartSubject.value;
    console.log('===== DEBUG CART STATE =====');
    console.log('Current cart in service:', currentCart);
    console.log('Total items:', currentCart.totalQuantity);
    console.log('Total price:', currentCart.totalPrice);
    
    const savedCart = localStorage.getItem('cart');
    console.log('Cart in localStorage:', savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Parsed localStorage cart:', parsedCart);
      } catch (e) {
        console.error('Error parsing localStorage cart:', e);
      }
    }
    console.log('===========================');
  }
} 