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
import { Address, AddressService } from '../services/address.service';
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
  private addressModal: any;
  userAddresses: Address[] = [];
  selectedAddressId: string = '';
  loadingAddresses: boolean = false;
  
  public orderFormData: {
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
    private addressService: AddressService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Khởi tạo component giỏ hàng');
    // Lưu trạng thái đăng nhập ban đầu
    this.previousLoginState = this.authService.isLoggedIn();
    this.isLoggedIn = this.previousLoginState;
    console.log('Trạng thái đăng nhập ban đầu:', this.previousLoginState);
    
    // Reset giá trị saveAddress để đảm bảo mặc định là false
    this.orderFormData.saveAddress = false;
    console.log('Đặt lại giá trị saveAddress:', this.orderFormData.saveAddress);
    
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
    
    // Initialize Bootstrap modals
    setTimeout(() => {
      this.modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
      this.addressModal = new bootstrap.Modal(document.getElementById('addressSelectionModal'));
      
      // Nếu người dùng đã đăng nhập, tải danh sách địa chỉ
      if (this.isLoggedIn) {
        this.loadUserAddresses();
      }
    }, 500);
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
   * Ghi log khi checkbox lưu địa chỉ thay đổi
   */
  onSaveAddressChange(event: any): void {
    console.log('Save address checkbox changed:', event.target.checked);
    this.orderFormData.saveAddress = event.target.checked;
    console.log('orderFormData.saveAddress updated:', this.orderFormData.saveAddress);
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
    const addressDetail = (document.getElementById('address') as HTMLInputElement)?.value;
    const saveAddress = (document.getElementById('saveAddress') as HTMLInputElement)?.checked;
    
    console.log('Thông tin nhập từ form:');
    console.log('- Họ tên:', fullName);
    console.log('- SĐT:', phone);
    console.log('- Email:', email);
    console.log('- Địa chỉ:', addressDetail);
    console.log('- Lưu địa chỉ (checkbox):', saveAddress);
    
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
    if (!fullName || !phone || !addressDetail) {
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
    const paymentMethodValue = paymentMethod ? paymentMethod.id : 'COD';
    
    // Thiết lập dữ liệu cho modal xác nhận
    (document.getElementById('review-fullname') as HTMLElement).innerText = fullName;
    (document.getElementById('review-phone') as HTMLElement).innerText = phone;
    (document.getElementById('review-email') as HTMLElement).innerText = email || 'Không có';
    (document.getElementById('review-address') as HTMLElement).innerText = addressDetail;
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
      address: this.formatAddress(addressDetail, ward, district, province),
      note,
      paymentMethod: paymentMethodValue,
      saveAddress
    };
    
    console.log('orderFormData sau khi được lưu:');
    console.log('- saveAddress:', this.orderFormData.saveAddress);
    console.log('- Giá trị checkbox gốc:', saveAddress);
    
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
    
    // Kiểm tra và đảm bảo tất cả các sản phẩm có servingSize
    this.cartItems.forEach((item, index) => {
      console.log(`Sản phẩm trong giỏ hàng #${index + 1}:`, JSON.stringify(item));
      if (!item.servingSize) {
        console.warn(`Sản phẩm ID ${item.productId} không có servingSize, thiết lập mặc định là '2'`);
        item.servingSize = '2';
      }
    });
    
    // Lấy thông tin người dùng nếu đã đăng nhập
    const user = this.isLoggedIn ? this.authService.getCurrentUser() : null;
    const userId = user?._id || user?.id;
    
    // Sử dụng accountId là userId nếu đã đăng nhập, ngược lại là "guest"
    const accountId = this.isLoggedIn && userId ? userId : 'guest';
    
    // Lấy email trực tiếp từ form để đảm bảo có giá trị mới nhất
    const emailValue = (document.getElementById('email') as HTMLInputElement)?.value || '';
    console.log('Email lấy trực tiếp từ DOM:', emailValue);
    
    // Chuẩn bị thông tin khách hàng
    const guestInfo = {
      fullName: this.orderFormData.fullName,
      phone: this.orderFormData.phone,
      email: emailValue || '', // Sử dụng giá trị email được lấy trực tiếp từ DOM
      address: this.orderFormData.address
    };
    
    console.log('Thông tin khách hàng (guestInfo):', guestInfo);
    
    // Xử lý lưu địa chỉ mới vào sổ địa chỉ (nếu người dùng đã đăng nhập, có tích vào ô lưu địa chỉ, và không dùng địa chỉ có sẵn)
    console.log('------KỸ THUẬT KỸ THUẬT------');
    console.log('Trạng thái đăng nhập:', this.isLoggedIn);
    console.log('User ID:', userId);
    console.log('Tích lưu địa chỉ:', this.orderFormData.saveAddress);
    console.log('selectedAddressId:', this.selectedAddressId);
    console.log('Email hiện tại:', emailValue);
    
    // Kiểm tra giá trị checkbox trực tiếp từ DOM
    const saveAddressElement = document.getElementById('saveAddress') as HTMLInputElement;
    const isDOMSaveChecked = saveAddressElement?.checked;
    console.log('Trạng thái checkbox từ DOM:', isDOMSaveChecked);
    console.log('Trạng thái checkbox từ orderFormData:', this.orderFormData.saveAddress);
    
    // Lấy thông tin địa chỉ hiện tại từ form
    const addressDetail = (document.getElementById('address') as HTMLInputElement)?.value;
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    
    const province = provinceSelect?.options[provinceSelect?.selectedIndex]?.text || '';
    const district = districtSelect?.selectedIndex > 0 ? districtSelect?.options[districtSelect?.selectedIndex]?.text : '';
    const ward = wardSelect?.selectedIndex > 0 ? wardSelect?.options[wardSelect?.selectedIndex]?.text : '';
    
    console.log('Đang sử dụng địa chỉ:', {
      detail: addressDetail,
      province,
      district,
      ward,
      fullAddress: this.orderFormData.address,
      email: emailValue
    });
    console.log('------KỸ THUẬT KỸ THUẬT------');
    
    // Kiểm tra xem người dùng có đăng nhập và tích lưu địa chỉ không
    if (this.isLoggedIn && userId && this.orderFormData.saveAddress) {
      console.log('Đang xử lý lưu địa chỉ mới...');
      
      // Kiểm tra tính đầy đủ
      if (!addressDetail || !province || !district || !ward) {
        console.warn('Không thể lưu địa chỉ: Thiếu thông tin bắt buộc:', { 
          detail: addressDetail, city: province, district, ward 
        });
      } else {
        console.log('Thông tin địa chỉ trích xuất:', { 
          detail: addressDetail, city: province, district, ward, email: emailValue
        });
        
        // Đảm bảo email từ DOM được lấy mới nhất trước khi tạo đối tượng
        const formEmail = (document.getElementById('email') as HTMLInputElement)?.value;
        console.log('Email trước khi lưu địa chỉ (lấy trực tiếp từ form):', formEmail);
        
        // Kiểm tra kỹ hơn giá trị email
        const isEmailEmpty = !formEmail || formEmail.trim() === '';
        console.log('Email có trống không?', isEmailEmpty);
        
        // Đảm bảo email không phải là null hoặc undefined khi chuyển sang JSON
        const safeEmailValue = formEmail || '';
        
        // Tạo đối tượng địa chỉ mới với định dạng rõ ràng
        const addressObject = {
          accountId: userId,
          recipientName: this.orderFormData.fullName,
          recipientPhone: this.orderFormData.phone,
          email: safeEmailValue, // Sử dụng biến email đã được kiểm tra
          detail: addressDetail,
          ward: ward,
          district: district,
          city: province,
          isDefault: false
        };

        // Chuyển đối tượng thành JSON string và log để kiểm tra
        const addressJSON = JSON.stringify(addressObject);
        console.log('JSON chuẩn bị gửi đi:', addressJSON);
        
        // Parse lại JSON để kiểm tra
        const parsedAddress = JSON.parse(addressJSON);
        console.log('Sau khi parse JSON:', parsedAddress);
        console.log('Email sau khi parse JSON:', parsedAddress.email);

        // Kiểm tra lần cuối tất cả các trường bắt buộc
        if (!parsedAddress.accountId || !parsedAddress.recipientName || !parsedAddress.recipientPhone || 
            !parsedAddress.city || !parsedAddress.district || !parsedAddress.ward || !parsedAddress.detail) {
          console.error('Không thể lưu địa chỉ: Thiếu thông tin bắt buộc trong đối tượng địa chỉ:', parsedAddress);
        } else {
          // Sử dụng đối tượng đã được parse lại để gửi lên server
          this.addressService.addAddress(parsedAddress).subscribe({
            next: (savedAddress) => {
              console.log('Đã lưu địa chỉ mới thành công:', savedAddress);
              
              // Kiểm tra chi tiết phản hồi từ API
              console.log('Phân tích chi tiết phản hồi từ API:');
              console.log('Kiểu dữ liệu phản hồi:', typeof savedAddress);
              
              if (savedAddress) {
                // In ra tất cả các thuộc tính
                console.log('Tất cả thuộc tính của địa chỉ đã lưu:');
                for (const [key, value] of Object.entries(savedAddress)) {
                  console.log(`${key}: "${value}" (kiểu: ${typeof value})`);
                }
                
                // Kiểm tra cụ thể trường email
                console.log('Email trong địa chỉ đã lưu:', savedAddress.email);
                console.log('Email gốc đã gửi đi:', parsedAddress.email);
                console.log('Email có trong yêu cầu?', 'email' in parsedAddress);
                console.log('Email có trong phản hồi?', 'email' in savedAddress);
                
                if (!savedAddress.email && parsedAddress.email) {
                  console.warn('CHÚ Ý: Email không được lưu trong địa chỉ mới mặc dù đã gửi trong yêu cầu!');
                  console.warn('Chi tiết của yêu cầu:', parsedAddress);
                  console.warn('Chi tiết của phản hồi:', savedAddress);
                }
              }
              
              // Hiển thị thông báo thành công cho người dùng
              setTimeout(() => {
                alert('Đã lưu địa chỉ mới vào sổ địa chỉ của bạn!');
              }, 1000);
              
              if (savedAddress && savedAddress._id) {
                this.selectedAddressId = savedAddress._id;
              }
            },
            error: (error) => {
              console.error('Lỗi khi lưu địa chỉ mới:', error);
              if (error.error && error.error.message) {
                console.error('Chi tiết lỗi:', error.error.message);
                alert('Không thể lưu địa chỉ: ' + error.error.message);
              } else {
                alert('Không thể lưu địa chỉ vào sổ. Vui lòng thử lại sau.');
              }
            }
          });
        }
      }
    } else {
      console.log('Không lưu địa chỉ mới, kiểm tra điều kiện:');
      console.log('- Đã đăng nhập:', this.isLoggedIn);
      console.log('- Có user ID:', !!userId);
      console.log('- Đã tích lưu địa chỉ:', this.orderFormData.saveAddress);
    }
    
    // Chuẩn bị phương thức thanh toán
    const paymentMethod = this.orderFormData.paymentMethod.toUpperCase();
    
    // Chuẩn bị dữ liệu đơn hàng với cùng một cấu trúc cho cả hai trường hợp
    const orderData = {
      accountId: accountId,
      itemOrder: this.cartItems.map(item => ({
        productId: item.productId,
        name: item.productName || item.ingredientName || 'Sản phẩm không tên',
        img: item.mainImage || '',
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        servingSize: item.servingSize
      })),
      prePrice: this.totalPrice,
      discount: 0,
      shippingFee: 0,
      totalPrice: this.totalPrice,
      paymentMethod: paymentMethod,
      guestInfo: guestInfo  // Luôn sử dụng guestInfo, bất kể có đăng nhập hay không
    };

    console.log('Dữ liệu đơn hàng gửi đi:', JSON.stringify(orderData, null, 2));

    // Gửi đơn hàng lên server
    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('Đặt hàng thành công:', response);
        this.modal.hide();
        this.cartService.clearCart().subscribe();
        alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
        this.router.navigate(['/trang-chu']);
      },
      error: (error) => {
        console.error('Lỗi khi đặt hàng:', error);
        let errorMessage = 'Có lỗi xảy ra khi đặt hàng. ';
        if (error.error?.message) {
          errorMessage += error.error.message;
        } else if (error.status === 400) {
          errorMessage += 'Thông tin đơn hàng không hợp lệ.';
        } else {
          errorMessage += 'Vui lòng thử lại sau.';
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

  /**
   * Tải địa chỉ của người dùng
   */
  loadUserAddresses(): void {
    if (!this.isLoggedIn) {
      return;
    }
    
    this.loadingAddresses = true;
    console.log('Bắt đầu tải danh sách địa chỉ...');
    
    this.addressService.getUserAddresses().subscribe({
      next: (response) => {
        console.log('Đã tải địa chỉ người dùng thành công:', response);
        if (response && response.data && Array.isArray(response.data)) {
          this.userAddresses = response.data;
          console.log(`Đã tìm thấy ${this.userAddresses.length} địa chỉ`);
          
          // Nếu có địa chỉ mặc định, chọn nó
          const defaultAddress = this.userAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            this.selectedAddressId = defaultAddress._id;
            console.log('Đã chọn địa chỉ mặc định:', defaultAddress);
          }
        } else {
          this.userAddresses = [];
          console.warn('Không tìm thấy địa chỉ nào hoặc dữ liệu không đúng định dạng');
        }
        this.loadingAddresses = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải địa chỉ người dùng:', error);
        // Log thông tin chi tiết hơn về lỗi
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
        if (error.status) {
          console.error('HTTP Status:', error.status);
        }
        alert('Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.');
        this.loadingAddresses = false;
      }
    });
  }

  /**
   * Hiển thị modal chọn địa chỉ
   */
  showAddressModal(): void {
    if (!this.isLoggedIn) {
      return;
    }
    
    if (this.userAddresses.length === 0) {
      this.loadUserAddresses();
    }
    
    this.addressModal.show();
  }

  /**
   * Chọn địa chỉ từ danh sách
   */
  selectAddress(address: Address): void {
    console.log('Đã chọn địa chỉ:', address);
    
    // Cập nhật trường nhập liệu với thông tin địa chỉ đã chọn
    const fullnameInput = document.getElementById('fullname') as HTMLInputElement;
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const addressInput = document.getElementById('address') as HTMLInputElement;
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    
    if (fullnameInput) fullnameInput.value = address.recipientName || '';
    if (phoneInput) phoneInput.value = address.recipientPhone || '';
    if (emailInput) emailInput.value = address.email || '';
    
    // Xác định các thành phần địa chỉ, xử lý cả 2 format của dữ liệu
    const addressDetail = address.address || address.detail || '';
    const wardName = address.ward || '';
    const districtName = address.district || '';
    const provinceName = address.province || address.city || '';
    
    // Cập nhật các select box
    if (provinceSelect) {
      // Tìm và chọn tỉnh/thành phố tương ứng
      for (let i = 0; i < provinceSelect.options.length; i++) {
        if (provinceSelect.options[i].text === provinceName) {
          provinceSelect.selectedIndex = i;
          break;
        }
      }
    }

    if (districtSelect) {
      // Tìm và chọn quận/huyện tương ứng
      for (let i = 0; i < districtSelect.options.length; i++) {
        if (districtSelect.options[i].text === districtName) {
          districtSelect.selectedIndex = i;
          break;
        }
      }
    }

    if (wardSelect) {
      // Tìm và chọn phường/xã tương ứng
      for (let i = 0; i < wardSelect.options.length; i++) {
        if (wardSelect.options[i].text === wardName) {
          wardSelect.selectedIndex = i;
          break;
        }
      }
    }
    
    // Gộp các thành phần địa chỉ
    const fullAddress = this.formatAddressFromParts(addressDetail, wardName, districtName, provinceName);
    if (addressInput) addressInput.value = addressDetail; // Chỉ điền phần địa chỉ chi tiết
    
    // Ẩn modal
    this.addressModal.hide();
    
    // Lưu ID địa chỉ đã chọn
    this.selectedAddressId = address._id;
  }

  /**
   * Gộp các thành phần địa chỉ thành một chuỗi
   */
  public formatAddressFromParts(addressDetail: string, ward: string, district: string, province: string): string {
    // Filter out empty or undefined values
    const parts = [addressDetail, ward, district, province].filter(part => part && part.trim() !== '');
    
    // Join the parts with commas
    return parts.join(', ');
  }
}