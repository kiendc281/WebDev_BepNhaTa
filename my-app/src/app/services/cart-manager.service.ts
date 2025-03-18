import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, finalize, of, switchMap, throwError, tap, catchError } from 'rxjs';
import { Cart, CartItem } from '../models/cart.interface';
import { Product } from '../models/product.interface';
import { AuthService } from './auth.service';
import { GuestCartService } from './guest-cart.service';
import { UserCartService } from './user-cart.service';

@Injectable({
  providedIn: 'root'
})
export class CartManagerService implements OnDestroy {
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private guestCartService: GuestCartService,
    private userCartService: UserCartService
  ) {
    console.log('CartManagerService khởi tạo');
    this.initCartSyncBasedOnAuthState();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  addToCart(product: Product, quantity: number, servingSize: string, price: number): Observable<Cart> {
    console.log('Thêm vào giỏ hàng:', { product, quantity, servingSize, price });
    this.loadingSubject.next(true);
    
    // Kiểm tra đầu vào
    if (!product || !product._id || quantity <= 0 || !servingSize || price <= 0) {
      console.error('Dữ liệu đầu vào không hợp lệ:', { product, quantity, servingSize, price });
      this.loadingSubject.next(false);
      return throwError(() => new Error('Dữ liệu sản phẩm không hợp lệ'));
    }

    if (this.isLoggedIn()) {
      console.log('Người dùng đã đăng nhập, thêm vào giỏ hàng server');
      return this.userCartService.addToCart(product, quantity, servingSize, price).pipe(
        tap(cart => {
          console.log('Cập nhật giỏ hàng sau khi thêm sản phẩm:', cart);
          this.updateCartState(cart);
        }),
        catchError(error => {
          console.error('Lỗi khi thêm vào giỏ hàng server:', error);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      console.log('Người dùng chưa đăng nhập, thêm vào giỏ hàng cục bộ');
      try {
        this.guestCartService.addToLocalCart(product, quantity, servingSize, price);
        const cart = this.guestCartService.getCurrentCart();
        this.updateCartState(cart);
        this.loadingSubject.next(false);
        return of(cart);
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng cục bộ:', error);
        this.loadingSubject.next(false);
        return throwError(() => new Error('Không thể thêm sản phẩm vào giỏ hàng cục bộ'));
      }
    }
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng
   */
  updateQuantity(productId: string, servingSize: string, quantity: number): Observable<Cart> {
    console.log('Cập nhật số lượng:', { productId, servingSize, quantity });
    this.loadingSubject.next(true);
    
    if (this.isLoggedIn()) {
      console.log('Người dùng đã đăng nhập, cập nhật giỏ hàng server');
      return this.userCartService.updateQuantity(productId, servingSize, quantity).pipe(
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      console.log('Người dùng chưa đăng nhập, cập nhật giỏ hàng cục bộ');
      this.guestCartService.updateQuantity(productId, servingSize, quantity);
      this.loadingSubject.next(false);
      return of(this.guestCartService.getCurrentCart());
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   */
  removeFromCart(productId: string, servingSize: string): Observable<Cart> {
    console.log('Xóa sản phẩm:', { productId, servingSize });
    this.loadingSubject.next(true);
    
    if (this.isLoggedIn()) {
      console.log('Người dùng đã đăng nhập, xóa khỏi giỏ hàng server');
      return this.userCartService.removeFromCart(productId, servingSize).pipe(
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      console.log('Người dùng chưa đăng nhập, xóa khỏi giỏ hàng cục bộ');
      this.guestCartService.removeFromCart(productId, servingSize);
      this.loadingSubject.next(false);
      return of(this.guestCartService.getCurrentCart());
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clearCart(): Observable<Cart> {
    console.log('Xóa toàn bộ giỏ hàng');
    this.loadingSubject.next(true);
    
    if (this.isLoggedIn()) {
      console.log('Người dùng đã đăng nhập, xóa giỏ hàng server');
      return this.userCartService.clearCart().pipe(
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      console.log('Người dùng chưa đăng nhập, xóa giỏ hàng cục bộ');
      this.guestCartService.clearCart();
      this.loadingSubject.next(false);
      return of(this.guestCartService.getCurrentCart());
    }
  }

  /**
   * Tải giỏ hàng dựa trên trạng thái đăng nhập
   */
  loadCart(): Observable<Cart> {
    this.loadingSubject.next(true);
    
    if (this.isLoggedIn()) {
      console.log('Người dùng đã đăng nhập, tải giỏ hàng từ server');
      return this.userCartService.loadCart().pipe(
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      console.log('Người dùng chưa đăng nhập, tải giỏ hàng từ local');
      this.guestCartService.loadLocalCart();
      const cart = this.guestCartService.getCurrentCart();
      this.loadingSubject.next(false);
      return of(cart);
    }
  }

  /**
   * Hợp nhất giỏ hàng local với giỏ hàng server khi đăng nhập
   */
  mergeCartsAfterLogin(): Observable<Cart> {
    console.log('Bắt đầu đồng bộ giỏ hàng sau đăng nhập...');
    this.loadingSubject.next(true);
    
    if (!this.isLoggedIn()) {
      console.error('Không thể đồng bộ giỏ hàng: Người dùng chưa đăng nhập');
      this.loadingSubject.next(false);
      return throwError(() => new Error('Người dùng chưa đăng nhập'));
    }

    // Lấy giỏ hàng local nếu có
    const localCart = this.guestCartService.getCurrentCart();
    console.log('Giỏ hàng local trước khi đồng bộ:', localCart);

    // Hợp nhất với giỏ hàng server
    return this.userCartService.mergeCartsAfterLogin(localCart).pipe(
      switchMap((mergedCart) => {
        console.log('Đã đồng bộ giỏ hàng thành công:', mergedCart);
        // Sau khi đồng bộ thành công, xóa giỏ hàng cục bộ để tránh trùng lặp
        this.guestCartService.clearCart();
        return of(mergedCart);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Tải lại giỏ hàng
   */
  reloadCart(): Observable<Cart> {
    console.log('Tải lại giỏ hàng từ service');
    this.debugCart();
    return this.loadCart();
  }

  /**
   * Chuyển đến trang thanh toán
   */
  proceedToCheckout(): void {
    console.log('Chuẩn bị chuyển đến trang thanh toán');
    // Thêm logic thanh toán ở đây nếu cần
    // Ví dụ: Chuyển hướng đến trang thanh toán, kiểm tra đăng nhập, v.v.
  }

  /**
   * Debug giỏ hàng hiện tại
   */
  debugCart(): void {
    console.log('===== DEBUG CART STATE =====');
    console.log('Đã đăng nhập?', this.isLoggedIn());
    
    if (this.isLoggedIn()) {
      this.userCartService.debugCart();
    } else {
      this.guestCartService.debugCart();
    }
    
    console.log('===========================');
  }

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   */
  private isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Cập nhật trạng thái giỏ hàng chính
   */
  private updateCartState(cart: Cart): void {
    this.cartSubject.next(cart);
    this.cartItems.next(cart.items || []);
  }

  /**
   * Khởi tạo và đồng bộ giỏ hàng dựa trên trạng thái đăng nhập
   */
  private initCartSyncBasedOnAuthState(): void {
    // Đăng ký theo dõi sự thay đổi của trạng thái đăng nhập
    const authSub = this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
      console.log('Phát hiện thay đổi trạng thái đăng nhập:', isLoggedIn);
      
      if (isLoggedIn) {
        console.log('Người dùng đã đăng nhập, đồng bộ giỏ hàng với server');
        this.syncCartAfterLogin();
      } else {
        console.log('Người dùng chưa đăng nhập, sử dụng giỏ hàng cục bộ');
        this.guestCartService.loadLocalCart();
      }
    });
    
    this.subscriptions.push(authSub);

    // Đăng ký theo dõi sự thay đổi từ giỏ hàng local
    const guestCartSub = this.guestCartService.cart$.subscribe(cart => {
      if (!this.isLoggedIn()) {
        console.log('Cập nhật giỏ hàng chính từ giỏ hàng cục bộ');
        this.updateCartState(cart);
      }
    });
    
    this.subscriptions.push(guestCartSub);

    // Đăng ký theo dõi sự thay đổi từ giỏ hàng server
    const userCartSub = this.userCartService.cart$.subscribe(cart => {
      if (this.isLoggedIn()) {
        console.log('Cập nhật giỏ hàng chính từ giỏ hàng server');
        this.updateCartState(cart);
      }
    });
    
    this.subscriptions.push(userCartSub);

    // Khởi tạo giỏ hàng ban đầu
    if (this.isLoggedIn()) {
      console.log('Khởi tạo với người dùng đã đăng nhập, tải giỏ hàng từ server');
      this.loadingSubject.next(true);
      this.userCartService.loadCart().subscribe({
        next: () => this.loadingSubject.next(false),
        error: () => this.loadingSubject.next(false)
      });
    } else {
      console.log('Khởi tạo với người dùng chưa đăng nhập, tải giỏ hàng từ local');
      this.guestCartService.loadLocalCart();
    }
  }

  /**
   * Đồng bộ giỏ hàng sau khi đăng nhập
   */
  private syncCartAfterLogin(): void {
    console.log('Đồng bộ giỏ hàng sau khi đăng nhập');
    this.mergeCartsAfterLogin().subscribe({
      error: (error) => {
        console.error('Lỗi khi đồng bộ giỏ hàng:', error);
      }
    });
  }

  /**
   * Lấy giỏ hàng hiện tại
   */
  getCurrentCart(): Cart {
    if (this.isLoggedIn()) {
      return this.userCartService.getCurrentCart();
    } else {
      return this.guestCartService.getCurrentCart();
    }
  }

  /**
   * Lấy giỏ hàng mới nhất (cập nhật từ server hoặc localStorage)
   */
  getLatestCart(): Observable<Cart> {
    this.loadingSubject.next(true);
    return this.loadCart().pipe(
      finalize(() => this.loadingSubject.next(false))
    );
  }
} 