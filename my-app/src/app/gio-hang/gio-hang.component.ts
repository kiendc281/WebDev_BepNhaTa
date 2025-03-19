import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartManagerService } from '../services/cart-manager.service';
import { CartItem } from '../models/cart.interface';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
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
  private orderFormData: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    note: string;
    paymentMethod: string;
    saveAddress: boolean;
  } = {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    paymentMethod: 'cod',
    saveAddress: false
  };
  
  constructor(
    private cartService: CartManagerService, 
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
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
   * Chuẩn bị thanh toán và hiển thị modal xác nhận
   */
  proceedToCheckout(): void {
    // Kiểm tra giỏ hàng có sản phẩm không
    if (!this.cartItems || this.cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }

    // Lấy thông tin từ form
    const fullName = (document.getElementById('fullname') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const address = (document.getElementById('address') as HTMLInputElement)?.value;
    const saveAddress = (document.getElementById('saveAddress') as HTMLInputElement)?.checked;
    
    // Lấy giá trị của các select box địa chỉ
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    
    const province = provinceSelect?.options[provinceSelect?.selectedIndex]?.text || '';
    const district = districtSelect?.selectedIndex > 0 ? districtSelect?.options[districtSelect?.selectedIndex]?.text : '';
    const ward = wardSelect?.selectedIndex > 0 ? wardSelect?.options[wardSelect?.selectedIndex]?.text : '';
    
    // Ghi log kiểm tra các giá trị
    console.log('Thông tin địa chỉ:', { province, district, ward });
    
    // Lấy ghi chú
    const note = (document.getElementById('note') as HTMLInputElement)?.value;
    
    // Kiểm tra thông tin bắt buộc
    if (!fullName || !phone || !address) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng (họ tên, số điện thoại và địa chỉ)');
      return;
    }
    
    // Kiểm tra định dạng số điện thoại
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập lại!');
      return;
    }
    
    // Kiểm tra định dạng email nếu có nhập
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        alert('Email không hợp lệ. Vui lòng nhập lại!');
        return;
      }
    }
    
    // Lấy phương thức thanh toán
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
    const paymentMethodValue = paymentMethod ? paymentMethod.id : 'cod';
    
    // Thiết lập dữ liệu cho modal xác nhận
    (document.getElementById('review-fullname') as HTMLElement).innerText = fullName;
    (document.getElementById('review-phone') as HTMLElement).innerText = phone;
    (document.getElementById('review-email') as HTMLElement).innerText = email || 'Không có';
    (document.getElementById('review-address') as HTMLElement).innerText = address;
    (document.getElementById('review-province') as HTMLElement).innerText = province;
    (document.getElementById('review-district') as HTMLElement).innerText = district || 'Không có';
    (document.getElementById('review-ward') as HTMLElement).innerText = ward || 'Không có';
    
    // Thiết lập phương thức thanh toán
    (document.getElementById('review-payment-method') as HTMLElement).innerText = 
      paymentMethodValue === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
    
    (document.getElementById('review-payment-description') as HTMLElement).innerText = 
      paymentMethodValue === 'COD' ? 'Bạn sẽ thanh toán khi nhận được hàng' : 
      'Vui lòng chuyển khoản theo thông tin bên dưới';
    
    // Hiển thị/ẩn thông tin chuyển khoản
    const bankTransferDetails = document.getElementById('bank-transfer-details');
    if (bankTransferDetails) {
      bankTransferDetails.style.display = paymentMethodValue === 'BANK' ? 'block' : 'none';
    }
    
    // Lưu thông tin đơn hàng vào component để sử dụng khi xác nhận
    this.orderFormData = {
      fullName,
      phone,
      email,
      address: this.formatAddress(address, ward, district, province),
      note,
      paymentMethod: paymentMethodValue,
      saveAddress
    };
    
    // Hiển thị modal xác nhận
    this.modal.show();
  }

  /**
   * Format địa chỉ đầy đủ, loại bỏ thành phần trống
   */
  private formatAddress(address: string, ward: string, district: string, province: string): string {
    // Filter out empty or undefined values
    const parts = [address, ward, district, province].filter(part => part && part.trim() !== '' && part !== 'Không có');
    
    // Join the parts with commas
    const formattedAddress = parts.join(', ');
    
    console.log('Địa chỉ đã định dạng:', formattedAddress);
    
    return formattedAddress;
  }

  /**
   * Xác nhận đặt hàng và gửi đơn hàng lên server
   */
  confirmOrder(): void {
    console.log('Xác nhận đặt hàng với thông tin:', this.orderFormData);
    this.loading = true;
    
    // Chuẩn bị dữ liệu đơn hàng dựa trên trạng thái đăng nhập
    let orderData: any;
    
    if (this.isLoggedIn) {
      // Người dùng đã đăng nhập
      const user = this.authService.getCurrentUser();
      const userId = user?._id || user?.id;
      
      if (!userId) {
        alert('Không thể xác định ID người dùng. Vui lòng đăng nhập lại!');
        this.loading = false;
        return;
      }
      
      // TODO: Lấy addressId từ danh sách địa chỉ của người dùng
      // Hiện tại đang để trống addressId, bạn cần tích hợp với service quản lý địa chỉ
      
      // Nếu người dùng chọn lưu địa chỉ, tạo địa chỉ mới
      if (this.orderFormData.saveAddress) {
        // TODO: Lưu địa chỉ mới nếu người dùng chọn lưu
        // Nên tạo một AddressService riêng để quản lý
      }
      
      // Chuyển đổi paymentMethod thành chữ hoa để phù hợp với enum trong model
      const paymentMethod = this.orderFormData.paymentMethod === 'cod' ? 'COD' : this.orderFormData.paymentMethod;
      
      orderData = this.orderService.prepareUserOrderData(
        userId,
        'placeholder-address-id', // Cần thay thế bằng addressId thực tế
        this.cartItems,
        this.totalPrice,
        paymentMethod
      );
      
      // Nếu không có addressId, sử dụng dữ liệu người dùng làm thông tin khách
      if (!orderData.addressId) {
        orderData.guestInfo = {
          fullName: this.orderFormData.fullName,
          phone: this.orderFormData.phone,
          email: this.orderFormData.email,
          address: this.orderFormData.address,
          note: this.orderFormData.note
        };
        delete orderData.addressId; // Xóa addressId nếu không có
      }
    } else {
      // Khách vãng lai
      // Chuyển đổi paymentMethod thành chữ hoa để phù hợp với enum trong model
      const paymentMethod = this.orderFormData.paymentMethod === 'cod' ? 'COD' : this.orderFormData.paymentMethod;
      
      orderData = this.orderService.prepareGuestOrderData(
        this.cartItems,
        this.totalPrice,
        this.orderFormData,
        paymentMethod
      );
    }
    
    // Gửi đơn hàng lên server
    console.log('Dữ liệu đơn hàng gửi đi:', JSON.stringify(orderData, null, 2));
    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('Đặt hàng thành công:', response);
        
        // Ẩn modal xác nhận
        this.modal.hide();
        
        // Xóa giỏ hàng
        this.cartService.clearCart().subscribe();
        
        // Hiển thị thông báo thành công
        alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
        
        // Chuyển hướng đến trang chủ hoặc trang cảm ơn
        this.router.navigate(['/trang-chu']);
      },
      error: (error) => {
        console.error('Lỗi khi đặt hàng:', error);
        
        // Hiển thị thông tin lỗi chi tiết hơn
        let errorMessage = 'Có lỗi xảy ra khi đặt hàng. ';
        
        if (error.status === 0) {
          errorMessage += 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
        } else if (error.status === 400) {
          errorMessage += error.error?.message || 'Dữ liệu đơn hàng không hợp lệ.';
        } else if (error.status === 500) {
          errorMessage += 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
        } else {
          errorMessage += error.error?.message || 'Vui lòng thử lại sau.';
        }
        
        alert(errorMessage);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
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