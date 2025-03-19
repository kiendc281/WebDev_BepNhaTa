import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartManagerService } from '../services/cart-manager.service';
import { CartItem } from '../models/cart.interface';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
declare var bootstrap: any;

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
  loading: boolean = false;
  isLoggedIn: boolean = false;
  private cartSubscription?: Subscription;
  private loadingSubscription?: Subscription;
  private authChangeSubscription?: Subscription;
  private previousLoginState: boolean = false;
  private modal: any;
  
  constructor(
    private cartService: CartManagerService, 
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Khởi tạo component giỏ hàng');
    // Lưu trạng thái đăng nhập ban đầu
    this.previousLoginState = this.authService.isLoggedIn();
    this.isLoggedIn = this.previousLoginState;
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
    
    // Initialize Bootstrap modal
    this.modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
  }

  ngOnDestroy(): void {
    // Hủy các subscription khi component bị hủy
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
      console.log('Đã hủy đăng ký theo dõi giỏ hàng');
    }
    
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
        this.isLoggedIn = currentLoginState;
        
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
        this.cartItems = cart.items.map(item => ({
          ...item,
          selected: item.selected === undefined ? false : item.selected // Đảm bảo thuộc tính selected luôn tồn tại
        }));
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
    
    if (quantity <= 0) {
      this.removeItem(item);
    } else {
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
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clearCart(): void {
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
    // Kiểm tra thông tin địa chỉ
    const fullname = (document.getElementById('fullname') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const address = (document.getElementById('address') as HTMLInputElement)?.value;
    const province = (document.querySelector('select') as HTMLSelectElement)?.value;
    const district = (document.querySelectorAll('select')[1] as HTMLSelectElement)?.value;
    const ward = (document.querySelectorAll('select')[2] as HTMLSelectElement)?.value;

    if (!fullname || !phone || !email || !address || !province || !district || !ward) {
      alert('Vui lòng điền đầy đủ thông tin địa chỉ giao hàng');
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Vui lòng nhập email hợp lệ');
      return;
    }

    // Kiểm tra định dạng số điện thoại
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      alert('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }

    // Cập nhật thông tin trong modal
    document.getElementById('review-fullname')!.textContent = fullname;
    document.getElementById('review-phone')!.textContent = phone;
    document.getElementById('review-email')!.textContent = email;
    document.getElementById('review-address')!.textContent = address;
    document.getElementById('review-province')!.textContent = 
      (document.querySelector('select option:checked') as HTMLOptionElement)?.text || '';
    document.getElementById('review-district')!.textContent = 
      (document.querySelectorAll('select')[1].options[document.querySelectorAll('select')[1].selectedIndex] as HTMLOptionElement)?.text || '';
    document.getElementById('review-ward')!.textContent = 
      (document.querySelectorAll('select')[2].options[document.querySelectorAll('select')[2].selectedIndex] as HTMLOptionElement)?.text || '';
    
    // Lấy thông tin phương thức thanh toán
    const codRadio = document.getElementById('cod') as HTMLInputElement;
    const isCodSelected = codRadio ? codRadio.checked : true; // Mặc định là COD nếu không tìm thấy
    
    // Hiển thị thông tin thanh toán
    const paymentIcon = document.getElementById('review-payment-icon');
    const paymentMethod = document.getElementById('review-payment-method');
    const paymentDescription = document.getElementById('review-payment-description');
    const bankTransferDetails = document.getElementById('bank-transfer-details');
    
    if (paymentIcon && paymentMethod && paymentDescription && bankTransferDetails) {
      if (isCodSelected) {
        paymentIcon.className = 'cod-icon';
        paymentMethod.textContent = 'COD (Thanh toán khi nhận hàng)';
        paymentDescription.textContent = 'Bạn sẽ thanh toán bằng tiền mặt khi nhận được hàng.';
        bankTransferDetails.style.display = 'none';
      } else {
        paymentIcon.className = 'bank-icon';
        paymentMethod.textContent = 'Chuyển khoản ngân hàng';
        paymentDescription.textContent = 'Vui lòng chuyển khoản đến tài khoản ngân hàng của chúng tôi trong vòng 24 giờ.';
        bankTransferDetails.style.display = 'block';
        
        // Tạo mã đơn hàng cho nội dung chuyển khoản
        const orderCode = document.getElementById('payment-order-code');
        if (orderCode) {
          // Tạo mã đơn hàng từ tên và thời gian
          const timestamp = new Date().getTime();
          const randomCode = Math.floor(Math.random() * 1000);
          const orderNumber = `DH${timestamp.toString().slice(-6)}${randomCode}`;
          orderCode.textContent = orderNumber;
        }
      }
    }

    // Hiển thị modal
    this.modal.show();
  }

  /**
   * Xác nhận đặt hàng
   */
  confirmOrder(): void {
    // Đóng modal
    this.modal.hide();
    
    // Tiếp tục thanh toán
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
  }
}