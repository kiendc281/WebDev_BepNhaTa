import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
<<<<<<< HEAD
import { CartManagerService } from '../services/cart-manager.service';
import { CartItem } from '../models/cart.interface';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
=======
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/cart.interface';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5

@Component({
  selector: 'app-gio-hang',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gio-hang.component.html',
  styleUrls: ['./gio-hang.component.css']
})
export class GioHangComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;
<<<<<<< HEAD
  loading: boolean = false;
  private cartSubscription?: Subscription;
  private loadingSubscription?: Subscription;
  private authChangeSubscription?: Subscription;
  private previousLoginState: boolean = false;
  
  constructor(
    private cartService: CartManagerService, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Khởi tạo component giỏ hàng');
    // Lưu trạng thái đăng nhập ban đầu
    this.previousLoginState = this.authService.isLoggedIn();
    console.log('Trạng thái đăng nhập ban đầu:', this.previousLoginState);
    
    // Gọi debug để kiểm tra giỏ hàng hiện tại
    this.cartService.debugCart();
    
    // Đăng ký lắng nghe sự thay đổi của giỏ hàng
    this.subscribeToCartChanges();
    
    // Đăng ký lắng nghe trạng thái loading
    this.subscribeToLoadingState();
    
    // Tải dữ liệu giỏ hàng
    this.loadCartData();
    
    // Đăng ký lắng nghe thay đổi trạng thái đăng nhập
    this.setupAuthChangeListener();
  }

  ngOnDestroy(): void {
    // Hủy các subscription khi component bị hủy
=======
  loading: boolean = true;
  private cartSubscription?: Subscription;
  
  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    console.log('Khởi tạo component giỏ hàng');
    // Gọi debug để kiểm tra giỏ hàng hiện tại
    this.cartService.debugCart();
    
    // Tải dữ liệu giỏ hàng
    this.loadCartItems();
  }

  ngOnDestroy(): void {
    // Hủy subscription khi component bị hủy để tránh memory leak
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
      console.log('Đã hủy đăng ký theo dõi giỏ hàng');
    }
<<<<<<< HEAD
    
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
    
    if (this.authChangeSubscription) {
      this.authChangeSubscription.unsubscribe();
      console.log('Đã hủy đăng ký theo dõi trạng thái đăng nhập');
    }
  }

  /**
   * Thiết lập lắng nghe thay đổi trạng thái đăng nhập
   */
  setupAuthChangeListener(): void {
    // Kiểm tra trạng thái đăng nhập mỗi 1 giây
    this.authChangeSubscription = new Subscription();
    const authCheckInterval = setInterval(() => {
      const currentLoginState = this.authService.isLoggedIn();
      
      // Nếu trạng thái đăng nhập thay đổi
      if (currentLoginState !== this.previousLoginState) {
        console.log('Trạng thái đăng nhập thay đổi:', 
                   this.previousLoginState ? 'Đăng xuất' : 'Đăng nhập');
        
        // Cập nhật trạng thái đăng nhập
        this.previousLoginState = currentLoginState;
        
        if (currentLoginState) {
          // Người dùng vừa đăng nhập, cần tải lại giỏ hàng từ server
          console.log('Phát hiện đăng nhập mới, đồng bộ giỏ hàng với server');
          this.loading = true;
          this.cartService.mergeCartsAfterLogin().subscribe({
            next: (cart) => {
              console.log('Đã đồng bộ giỏ hàng thành công:', cart);
              this.loadCartData(); // Tải lại giỏ hàng sau khi đồng bộ
            },
            error: (error) => {
              console.error('Lỗi khi đồng bộ giỏ hàng:', error);
              this.loading = false;
            }
          });
        } else {
          // Người dùng vừa đăng xuất, cũng tải lại giỏ hàng (sẽ là giỏ hàng local)
          console.log('Phát hiện đăng xuất, tải lại giỏ hàng local');
          this.loadCartData();
        }
      }
    }, 1000);
    
    this.authChangeSubscription.add(() => {
      clearInterval(authCheckInterval);
      console.log('Đã dừng kiểm tra trạng thái đăng nhập');
    });
  }

  /**
   * Đăng ký lắng nghe sự thay đổi giỏ hàng
   */
  private subscribeToCartChanges(): void {
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      if (cart && Array.isArray(cart.items)) {
        // Lưu trữ ID và servingSize của các sản phẩm hiện có để giữ thứ tự
        const currentItemIds = this.cartItems.map(item => `${item.productId}_${item.servingSize}`);
        
        // Cập nhật các sản phẩm hiện có và thêm các sản phẩm mới
        const updatedItems = [...this.cartItems];
        
        // Cập nhật số lượng, giá và các thuộc tính khác cho các mục hiện có
        updatedItems.forEach((item, index) => {
          const newItem = cart.items.find(
            i => i.productId === item.productId && i.servingSize === item.servingSize
          );
          if (newItem) {
            updatedItems[index] = {
              ...item,
              quantity: newItem.quantity,
              price: newItem.price,
              selected: newItem.selected === undefined ? item.selected : newItem.selected
            };
          }
        });
        
        // Thêm các mục mới
        cart.items.forEach(newItem => {
          const key = `${newItem.productId}_${newItem.servingSize}`;
          if (!currentItemIds.includes(key)) {
            updatedItems.push({
              ...newItem,
              selected: newItem.selected === undefined ? false : newItem.selected
            });
          }
        });
        
        // Xóa các mục không còn tồn tại
        const newItemIds = cart.items.map(item => `${item.productId}_${item.servingSize}`);
        const finalItems = updatedItems.filter(item => {
          const key = `${item.productId}_${item.servingSize}`;
          return newItemIds.includes(key);
        });
        
        this.cartItems = finalItems;
        this.totalPrice = cart.totalPrice || 0;
        this.totalQuantity = cart.totalQuantity || 0;
      } else {
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalQuantity = 0;
      }
    });
  }

  /**
   * Đăng ký lắng nghe trạng thái loading
   */
  private subscribeToLoadingState(): void {
    this.loadingSubscription = this.cartService.loading$.subscribe(isLoading => {
      this.loading = isLoading;
    });
  }

  /**
   * Tải dữ liệu giỏ hàng
   */
  private loadCartData(): void {
    this.loading = true;
    console.log('Bắt đầu tải dữ liệu giỏ hàng');
    
    this.cartService.loadCart().subscribe({
      next: (cart) => {
        console.log('Đã tải giỏ hàng thành công:', cart);
        // Dữ liệu sẽ được cập nhật tự động qua cartSubscription
      },
      error: (error) => {
        console.error('Lỗi khi tải giỏ hàng:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Tải lại giỏ hàng (cho nút Refresh)
   */
  reloadCart(): void {
    console.log('Tải lại giỏ hàng');
    this.loading = true;
    
    // Đọc dữ liệu từ localStorage trước
    const savedCart = localStorage.getItem('cart');
    console.log('Giỏ hàng trong localStorage trước khi tải lại:', savedCart);
    
    // Tải lại dữ liệu giỏ hàng
    this.cartService.debugCart();
    
    // Tải lại CartService
    this.cartService.loadCart().subscribe({
      next: (cart) => {
        console.log('Đã tải lại giỏ hàng thành công:', cart);
      },
      error: (error) => {
        console.error('Lỗi khi tải lại giỏ hàng:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Xử lý sự kiện thay đổi số lượng từ input
   */
  handleQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      const newQuantity = parseInt(input.value, 10);
      this.updateQuantity(item, newQuantity);
    }
  }

  /**
   * Cập nhật số lượng sản phẩm
   */
  updateQuantity(item: CartItem, newQuantity: number | string): void {
    const quantity = typeof newQuantity === 'string' 
      ? parseInt(newQuantity, 10) 
      : newQuantity;
    
    if (isNaN(quantity)) {
      return;
    }
=======
  }

  loadCartItems(): void {
    this.loading = true;
    console.log('Bắt đầu tải dữ liệu giỏ hàng');
    
    // Kiểm tra dữ liệu giỏ hàng hiện tại trong localStorage
    const savedCart = localStorage.getItem('cart');
    console.log('Dữ liệu giỏ hàng trong localStorage:', savedCart);
    
    // Hủy subscription cũ nếu có
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
      console.log('Đã hủy đăng ký theo dõi giỏ hàng cũ');
    }
    
    // Đăng ký theo dõi giỏ hàng từ CartService
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      console.log('Dữ liệu giỏ hàng nhận được từ CartService:', cart);
      // Kiểm tra dữ liệu cart hợp lệ
      if (cart && Array.isArray(cart.items)) {
        this.cartItems = cart.items;
        this.totalPrice = cart.totalPrice || 0;
        this.totalQuantity = cart.totalQuantity || 0;
        console.log('Đã cập nhật dữ liệu giỏ hàng:', this.cartItems);
      } else {
        console.warn('Dữ liệu giỏ hàng không hợp lệ:', cart);
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalQuantity = 0;
      }
      this.loading = false;
    }, error => {
      console.error('Lỗi khi tải giỏ hàng:', error);
      this.loading = false;
      this.cartItems = [];
    });
  }

  updateQuantity(item: CartItem, newQuantity: number | string): void {
    // Đảm bảo newQuantity là số
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
    
    console.log(`Cập nhật số lượng sản phẩm ${item.ingredientName} từ ${item.quantity} thành ${quantity}`);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
    
    if (quantity <= 0) {
      this.removeItem(item);
    } else {
<<<<<<< HEAD
      this.cartService.updateQuantity(item.productId, item.servingSize, quantity).subscribe();
    }
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng
   */
  removeItem(item: CartItem): void {
    if (!item || !item.productId) {
      return;
    }
    
    this.cartService.removeFromCart(item.productId, item.servingSize).subscribe();
=======
      this.cartService.updateQuantity(item.productId, item.servingSize, quantity).subscribe(cart => {
        console.log('Đã cập nhật số lượng thành công:', cart);
      });
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.productId, item.servingSize).subscribe(cart => {
      console.log('Đã xóa sản phẩm khỏi giỏ hàng');
    });
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clearCart(): void {
<<<<<<< HEAD
    this.cartService.clearCart().subscribe();
  }

  /**
   * Tính tổng giá tiền cho một sản phẩm
   */
  getTotalPriceByItem(item: CartItem): number {
    if (!item || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
      return 0;
    }
    return item.quantity * item.price;
  }

  /**
   * Chuyển đến trang thanh toán
   */
  proceedToCheckout(): void {
    this.cartService.proceedToCheckout();
  }

  /**
   * Chọn/bỏ chọn tất cả sản phẩm
   */
  toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    this.cartItems.forEach(item => {
      item.selected = !allSelected;
    });
  }

  /**
   * Kiểm tra xem tất cả sản phẩm đã được chọn chưa
   */
  isAllSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
  }

  /**
   * Xử lý khi thay đổi trạng thái chọn của một sản phẩm
   */
  onItemSelectionChange(): void {
    // Có thể thêm logic xử lý ở đây nếu cần
    console.log('Đã thay đổi trạng thái chọn sản phẩm:', 
               this.cartItems.filter(item => item.selected).length, 
               'sản phẩm được chọn');
  }

  /**
   * Xóa các sản phẩm đã chọn
   */
  removeSelectedItems(): void {
    const selectedItems = this.cartItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      return;
    }
    
    // Xóa từng sản phẩm đã chọn
    selectedItems.forEach(item => {
      this.removeItem(item);
    });
=======
    this.cartService.clearCart().subscribe(cart => {
      console.log('Đã xóa toàn bộ giỏ hàng');
    });
  }

  getTotalPriceByItem(item: CartItem): number {
    return item.quantity * item.price;
  }

  proceedToCheckout(): void {
    // Chuyển đến trang thanh toán
    console.log('Chuyển đến trang thanh toán');
  }

  reloadCart(): void {
    console.log('Tải lại giỏ hàng');
    this.loading = true;
    
    // Đọc dữ liệu từ localStorage trước
    const savedCart = localStorage.getItem('cart');
    console.log('Giỏ hàng trong localStorage trước khi tải lại:', savedCart);
    
    // Tải lại dữ liệu giỏ hàng
    this.cartService.debugCart();
    
    // Tải lại CartService
    this.cartService.loadCart();
    
    // Cập nhật lại UI
    setTimeout(() => {
      this.loadCartItems();
    }, 500);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
  }
}