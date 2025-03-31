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
  
  notification: { show: boolean; message: string; type: 'success' | 'error' } = {
    show: false,
    message: '',
    type: 'success'
  };
  
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
    this.previousLoginState = this.authService.isLoggedIn();
    this.isLoggedIn = this.previousLoginState;
    console.log('Trạng thái đăng nhập ban đầu:', this.previousLoginState);
    
    this.orderFormData.saveAddress = false;
    console.log('Đặt lại giá trị saveAddress:', this.orderFormData.saveAddress);
    
    this.cartService.debugCart();
    
    this.subscribeToCartChanges();
    
    this.subscribeToLoadingState();
    
    this.loadCartData();
    
    this.setupAuthChangeListener();
    
    setTimeout(() => {
      this.modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
      this.addressModal = new bootstrap.Modal(document.getElementById('addressSelectionModal'));
      
      if (this.isLoggedIn) {
        console.log('Người dùng đã đăng nhập, tải danh sách địa chỉ...');
        this.loadUserAddresses();
      }
    }, 500);
  }

  ngOnDestroy(): void {
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

  setupAuthChangeListener(): void {
    this.authChangeSubscription = new Subscription();
    const authCheckInterval = setInterval(() => {
      const currentLoginState = this.authService.isLoggedIn();
      
      if (currentLoginState !== this.previousLoginState) {
        console.log('Trạng thái đăng nhập thay đổi:', 
                   this.previousLoginState ? 'Đăng xuất' : 'Đăng nhập');
        
        this.previousLoginState = currentLoginState;
        this.isLoggedIn = currentLoginState;
        
        if (currentLoginState) {
          console.log('Phát hiện đăng nhập mới, đồng bộ giỏ hàng với server');
          this.loading = true;
          this.cartService.mergeCartsAfterLogin().subscribe({
            next: (cart) => {
              console.log('Đã đồng bộ giỏ hàng thành công:', cart);
              this.loadCartData();
              
              // Tải địa chỉ người dùng sau khi đăng nhập thành công
              console.log('Đã đăng nhập, tải danh sách địa chỉ...');
              this.loadUserAddresses();
            },
            error: (error) => {
              console.error('Lỗi khi đồng bộ giỏ hàng:', error);
              this.loading = false;
            }
          });
        } else {
          console.log('Phát hiện đăng xuất, tải lại giỏ hàng local');
          this.loadCartData();
          
          // Xóa danh sách địa chỉ khi đăng xuất
          this.userAddresses = [];
        }
      }
    }, 1000);
    
    this.authChangeSubscription.add(() => {
      clearInterval(authCheckInterval);
      console.log('Đã dừng kiểm tra trạng thái đăng nhập');
    });
  }

  private subscribeToCartChanges(): void {
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      if (cart && Array.isArray(cart.items)) {
        this.cartItems = cart.items.map(item => ({
          ...item,
          selected: item.selected === undefined ? false : item.selected
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

  private subscribeToLoadingState(): void {
    this.loadingSubscription = this.cartService.loading$.subscribe(isLoading => {
      this.loading = isLoading;
    });
  }

  private loadCartData(): void {
    this.loading = true;
    console.log('Bắt đầu tải dữ liệu giỏ hàng');
    
    this.cartService.loadCart().subscribe({
      next: (cart) => {
        console.log('Đã tải giỏ hàng thành công:', cart);
      },
      error: (error) => {
        console.error('Lỗi khi tải giỏ hàng:', error);
        this.loading = false;
      }
    });
  }

  reloadCart(): void {
    console.log('Tải lại giỏ hàng');
    this.loading = true;
    
    const savedCart = localStorage.getItem('cart');
    console.log('Giỏ hàng trong localStorage trước khi tải lại:', savedCart);
    
    this.cartService.debugCart();
    
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

  handleQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      const newQuantity = parseInt(input.value, 10);
      this.updateQuantity(item, newQuantity);
    }
  }

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

  removeItem(item: CartItem): void {
    if (!item || !item.productId) {
      return;
    }
    
    this.cartService.removeFromCart(item.productId, item.servingSize).subscribe();
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe();
  }

  getTotalPriceByItem(item: CartItem): number {
    if (!item || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
      return 0;
    }
    return item.quantity * item.price;
  }

  onSaveAddressChange(event: any): void {
    console.log('Save address checkbox changed:', event.target.checked);
    this.orderFormData.saveAddress = event.target.checked;
    console.log('orderFormData.saveAddress updated:', this.orderFormData.saveAddress);
  }

  proceedToCheckout(): void {
    if (!this.cartItems || this.cartItems.length === 0) {
      this.showNotification('Giỏ hàng của bạn đang trống!', 'error');
      return;
    }

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
    
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    
    const province = provinceSelect?.options[provinceSelect?.selectedIndex]?.text || '';
    const district = districtSelect?.selectedIndex > 0 ? districtSelect?.options[districtSelect?.selectedIndex]?.text : '';
    const ward = wardSelect?.selectedIndex > 0 ? wardSelect?.options[wardSelect?.selectedIndex]?.text : '';
    
    console.log('Thông tin địa chỉ:', { province, district, ward });
    
    const note = (document.getElementById('note') as HTMLInputElement)?.value;
    
    if (!fullName || !phone || !addressDetail) {
      this.showNotification('Vui lòng nhập đầy đủ thông tin giao hàng (họ tên, số điện thoại và địa chỉ)', 'error');
      return;
    }
    
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      this.showNotification('Số điện thoại không hợp lệ. Vui lòng nhập lại!', 'error');
      return;
    }
    
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        this.showNotification('Email không hợp lệ. Vui lòng nhập lại!', 'error');
        return;
      }
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement;
    const paymentMethodValue = paymentMethod ? paymentMethod.id : 'COD';
    
    (document.getElementById('review-fullname') as HTMLElement).innerText = fullName;
    (document.getElementById('review-phone') as HTMLElement).innerText = phone;
    (document.getElementById('review-email') as HTMLElement).innerText = email || 'Không có';
    (document.getElementById('review-address') as HTMLElement).innerText = addressDetail;
    (document.getElementById('review-province') as HTMLElement).innerText = province;
    (document.getElementById('review-district') as HTMLElement).innerText = district || 'Không có';
    (document.getElementById('review-ward') as HTMLElement).innerText = ward || 'Không có';
    
    (document.getElementById('review-payment-method') as HTMLElement).innerText = 
      paymentMethodValue === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
    
    (document.getElementById('review-payment-description') as HTMLElement).innerText = 
      paymentMethodValue === 'COD' ? 'Bạn sẽ thanh toán khi nhận được hàng' : 
      'Vui lòng chuyển khoản theo thông tin bên dưới';
    
    const bankTransferDetails = document.getElementById('bank-transfer-details');
    if (bankTransferDetails) {
      bankTransferDetails.style.display = paymentMethodValue === 'BANK' ? 'block' : 'none';
    }
    
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
    
    this.modal.show();
  }

  private formatAddress(address: string, ward: string, district: string, province: string): string {
    const parts = [address, ward, district, province].filter(part => part && part.trim() !== '' && part !== 'Không có');
    
    const formattedAddress = parts.join(', ');
    
    console.log('Địa chỉ đã định dạng:', formattedAddress);
    
    return formattedAddress;
  }

  confirmOrder(): void {
    console.log('Bắt đầu xử lý xác nhận đơn hàng');
    
    if (!this.cartItems || this.cartItems.length === 0) {
      this.showNotification('Giỏ hàng của bạn đang trống!', 'error');
      return;
    }

    if (!this.validateUserInfo()) {
      return;
    }

    const formData = this.getFormData();
    if (!formData.email) {
      const emailConfirmEl = document.createElement('div');
      emailConfirmEl.innerHTML = 'Bạn chưa nhập email. Nhập email để nhận thông báo về đơn hàng của bạn. Bạn có muốn tiếp tục đặt hàng không?';
      
      const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal') || document.createElement('div'));
      
      const modalBodyEl = document.querySelector('#confirmModal .modal-body');
      if (modalBodyEl) {
        modalBodyEl.innerHTML = '';
        modalBodyEl.appendChild(emailConfirmEl);
      }
      
      confirmModal.show();
      
      const continueBtn = document.querySelector('#confirmModal .btn-continue');
      if (continueBtn) {
        const continueHandler = () => {
          continueBtn.removeEventListener('click', continueHandler);
          confirmModal.hide();
          this.processOrder(formData);
        };
        continueBtn.addEventListener('click', continueHandler);
      }
      
      const cancelBtn = document.querySelector('#confirmModal .btn-cancel');
      if (cancelBtn) {
        const cancelHandler = () => {
          cancelBtn.removeEventListener('click', cancelHandler);
          confirmModal.hide();
        };
        cancelBtn.addEventListener('click', cancelHandler);
      }
    } else {
      this.processOrder(formData);
    }
  }

  validateUserInfo(): boolean {
    const formData = this.getFormData();

    // Kiểm tra thông tin cơ bản
    if (!formData.fullName || !formData.phone || !formData.address) {
      this.showNotification('Vui lòng nhập đầy đủ thông tin giao hàng (họ tên, số điện thoại và địa chỉ)', 'error');
      return false;
    }

    // Kiểm tra định dạng số điện thoại
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    if (!phoneRegex.test(formData.phone)) {
      this.showNotification('Số điện thoại không hợp lệ. Vui lòng nhập lại!', 'error');
      return false;
    }

    // Kiểm tra định dạng email nếu có
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        this.showNotification('Email không hợp lệ. Vui lòng nhập lại!', 'error');
        return false;
      }
    }

    // Kiểm tra giỏ hàng có sản phẩm không
    if (!this.cartItems || this.cartItems.length === 0) {
      this.showNotification('Giỏ hàng trống. Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.', 'error');
      return false;
    }

    // Kiểm tra tỉnh/thành phố
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    if (!provinceSelect || provinceSelect.selectedIndex < 0) {
      this.showNotification('Vui lòng chọn Tỉnh/Thành phố', 'error');
      return false;
    }

    // Kiểm tra quận/huyện
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    if (!districtSelect || districtSelect.selectedIndex <= 0) {
      this.showNotification('Vui lòng chọn Quận/Huyện', 'error');
      return false;
    }

    // Kiểm tra phường/xã
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    if (!wardSelect || wardSelect.selectedIndex <= 0) {
      this.showNotification('Vui lòng chọn Phường/Xã', 'error');
      return false;
    }

    return true;
  }

  getFormData(): any {
    const fullName = (document.getElementById('fullname') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const address = (document.getElementById('address') as HTMLInputElement)?.value;
    const note = (document.getElementById('note') as HTMLInputElement)?.value;
    const paymentMethod = (document.querySelector('input[name="paymentMethod"]:checked') as HTMLInputElement)?.id;
    const saveAddress = (document.getElementById('saveAddress') as HTMLInputElement)?.checked;

    return {
      fullName,
      phone,
      email,
      address,
      note,
      paymentMethod,
      saveAddress
    };
  }

  processOrder(formData: any): void {
    console.log('Bắt đầu xử lý đơn hàng');
    
    this.loading = true;
    
    // Lấy thông tin từ formData
    const fullName = formData.fullName;
    const phone = formData.phone;
    const email = formData.email || '';
    const addressDetail = formData.address;
    const note = formData.note || '';
    const paymentMethod = formData.paymentMethod || 'COD';
    const saveAddress = formData.saveAddress || false;
    
    // Lấy thông tin từ select boxes
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    const districtSelect = document.getElementById('district') as HTMLSelectElement;
    const wardSelect = document.getElementById('ward') as HTMLSelectElement;
    
    const province = provinceSelect?.options[provinceSelect?.selectedIndex]?.text || '';
    const district = districtSelect?.selectedIndex > 0 ? districtSelect?.options[districtSelect?.selectedIndex]?.text : '';
    const ward = wardSelect?.selectedIndex > 0 ? wardSelect?.options[wardSelect?.selectedIndex]?.text : '';
    
    // Định dạng địa chỉ đầy đủ
    const fullAddress = this.formatAddress(addressDetail, ward, district, province);
    
    // Cập nhật orderFormData
    this.orderFormData = {
      fullName,
      phone,
      email,
      address: fullAddress,
      note,
      paymentMethod,
      saveAddress
    };
    
    console.log('orderFormData đã cập nhật:', this.orderFormData);
    
    // Kiểm tra và chuẩn hóa các items trong giỏ hàng
    this.cartItems.forEach((item, index) => {
      console.log(`Sản phẩm trong giỏ hàng #${index + 1}:`, JSON.stringify(item));
      if (!item.servingSize || item.servingSize === 'undefined') {
        item.servingSize = 'Mặc định';
        console.log('- Đã cập nhật servingSize thành "Mặc định"');
      }
    });
    
    // Xác định accountId
    const user = this.isLoggedIn ? this.authService.getCurrentUser() : null;
    const userId = user?._id || user?.id;
    const accountId = this.isLoggedIn && userId ? userId : 'guest';
    
    // Tạo mảng items từ cartItems với đầy đủ thông tin theo yêu cầu của backend
    const orderItems = this.cartItems.map(item => ({
      productId: item.productId,
      name: item.productName || item.ingredientName || 'Sản phẩm không tên',
      price: item.price,
      quantity: item.quantity,
      servingSize: item.servingSize || 'Mặc định',
      img: item.mainImage || '', // Đổi từ image sang img theo yêu cầu backend
      totalPrice: item.price * item.quantity // Đảm bảo có totalPrice cho mỗi item
    }));
    
    // Tạo guestInfo với đầy đủ thông tin
    const guestInfo = {
      fullName: fullName,
      phone: phone,
      email: email,
      address: fullAddress,
      note: note
    };
    
    // Tạo orderData trực tiếp với đầy đủ thông tin thiết yếu theo đúng cấu trúc backend yêu cầu
    const orderData = {
      accountId: accountId,
      itemOrder: orderItems,
      prePrice: this.totalPrice, // Đảm bảo prePrice luôn có giá trị
      discount: 0,
      shippingFee: 0,
      totalPrice: this.totalPrice,
      paymentMethod: paymentMethod.toUpperCase(),
      status: 'Đang xử lý', // Sử dụng đúng tên trường status
      guestInfo: guestInfo // Thông tin khách hàng (nếu đặt hàng không đăng nhập)
    };
    
    // Lưu thông tin đầy đủ để gỡ lỗi
    console.log('Thông tin đơn hàng sẽ gửi đi:', JSON.stringify(orderData, null, 2));

    // Kiểm tra và lưu địa chỉ mới nếu người dùng đã đăng nhập và tích vào ô lưu địa chỉ
    if (this.isLoggedIn && userId && saveAddress) {
      if (addressDetail && province) {
        const addressObject = {
          accountId: userId,
          recipientName: fullName,
          recipientPhone: phone,
          email: email,
          detail: addressDetail,
          ward: ward,
          district: district,
          city: province,
          isDefault: false
        };
        
        this.saveAddressToBook(userId, addressObject);
      }
    }

    this.orderService.createOrder(orderData).subscribe({
      next: (response) => {
        console.log('Đặt hàng thành công:', response);
        
        this.cartService.clearCart().subscribe();
        
        if (email) {
          this.showNotification('Đặt hàng thành công! Thông tin chi tiết đơn hàng đã được gửi vào email của bạn. Cảm ơn bạn đã mua hàng.', 'success');
        } else {
          this.showNotification('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.', 'success');
        }
        
        this.modal.hide();
        
        this.router.navigate(['/thanh-toan-thanh-cong']);
      },
      error: (error) => {
        console.error('Lỗi khi đặt hàng:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi đặt hàng. ';
        
        if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else {
          errorMessage += 'Vui lòng thử lại sau.';
        }
        this.showNotification(errorMessage, 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  saveAddressToBook(userId: string, addressData: any): void {
    if (!addressData.recipientName || !addressData.recipientPhone || !addressData.detail) {
      console.error('Không thể lưu địa chỉ: Thiếu thông tin bắt buộc:', addressData);
      return;
    }

    this.addressService.addAddress(addressData).subscribe({
      next: (savedAddress) => {
        console.log('Đã lưu địa chỉ mới thành công:', savedAddress);
        this.showNotification('Đã lưu địa chỉ mới vào sổ địa chỉ của bạn!', 'success');
        
        if (savedAddress && savedAddress._id) {
          this.selectedAddressId = savedAddress._id;
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu địa chỉ mới:', error);
        
        if (error.error && error.error.message) {
          this.showNotification('Không thể lưu địa chỉ: ' + error.error.message, 'error');
        } else {
          this.showNotification('Không thể lưu địa chỉ vào sổ. Vui lòng thử lại sau.', 'error');
        }
      }
    });
  }

  toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    this.cartItems.forEach(item => {
      item.selected = !allSelected;
    });
  }

  isAllSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
  }

  onItemSelectionChange(): void {
    console.log('Đã thay đổi trạng thái chọn sản phẩm:', 
               this.cartItems.filter(item => item.selected).length, 
               'sản phẩm được chọn');
  }

  removeSelectedItems(): void {
    const selectedItems = this.cartItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      return;
    }
    
    selectedItems.forEach(item => {
      this.removeItem(item);
    });
  }

  loadUserAddresses(): void {
    this.loadingAddresses = true;
    
    // Kiểm tra xem user đã đăng nhập chưa, không cần lấy userId
    if (!this.isLoggedIn) {
      console.error('Không thể tải địa chỉ: Người dùng chưa đăng nhập');
      this.loadingAddresses = false;
      return;
    }
    
    console.log('Đang tải danh sách địa chỉ người dùng...');
    
    // Gọi getUserAddresses không truyền tham số (API sẽ tự xác định user từ token)
    this.addressService.getUserAddresses().subscribe({
      next: (response: any) => {
        console.log('Đã tải địa chỉ người dùng thành công:', response);
        
        // Kiểm tra response có dạng mảng trực tiếp hay nằm trong data
        const addressData = Array.isArray(response) ? response : 
                           (response && response.data && Array.isArray(response.data)) ? response.data : [];
        
        console.log('Dữ liệu địa chỉ nhận được:', addressData);
        
        if (addressData.length > 0) {
          this.userAddresses = addressData.map((address: any) => ({
            ...address,
            formattedAddress: this.formatAddress(
              address.detail || address.address || '', 
              address.ward || '', 
              address.district || '', 
              address.city || address.province || ''
            )
          }));
          
          console.log('Đã xử lý và lưu', this.userAddresses.length, 'địa chỉ');
          
          const defaultAddress = this.userAddresses.find(address => address.isDefault);
          if (defaultAddress) {
            this.selectedAddressId = defaultAddress._id;
          } else if (this.userAddresses.length > 0) {
            this.selectedAddressId = this.userAddresses[0]._id;
          }
        } else {
          console.warn('Không có địa chỉ nào được tìm thấy trong response');
          this.userAddresses = [];
        }
        
        this.loadingAddresses = false;
      },
      error: (error: any) => {
        console.error('Lỗi khi tải địa chỉ người dùng:', error);
        this.loadingAddresses = false;
        
        this.showNotification('Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.', 'error');
      }
    });
  }

  showAddressModal(): void {
    if (!this.isLoggedIn) {
      this.showNotification('Vui lòng đăng nhập để sử dụng sổ địa chỉ', 'error');
      return;
    }
    
    // Luôn tải lại địa chỉ khi mở modal để đảm bảo dữ liệu mới nhất
    console.log('Mở modal địa chỉ, tải lại danh sách địa chỉ...');
    this.loadUserAddresses();
    
    // Chỉ hiển thị modal sau khi đã cố gắng tải địa chỉ
    setTimeout(() => {
      this.addressModal.show();
    }, 100);
  }

  selectAddress(address: Address): void {
    console.log('Đã chọn địa chỉ:', address);
    
    if (!address) {
      console.error('Địa chỉ không hợp lệ');
      return;
    }
    
    // Cập nhật selectedAddressId
    this.selectedAddressId = address._id;
    
    // Lấy các trường input
    const fullnameInput = document.getElementById('fullname') as HTMLInputElement;
    const phoneInput = document.getElementById('phone') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const addressInput = document.getElementById('address') as HTMLInputElement;
    
    // Cập nhật các trường thông tin cơ bản
    if (fullnameInput) fullnameInput.value = address.recipientName || '';
    if (phoneInput) phoneInput.value = address.recipientPhone || '';
    if (emailInput) emailInput.value = address.email || '';
    if (addressInput) addressInput.value = address.address || address.detail || '';
    
    // Lấy giá trị tỉnh/thành phố, quận/huyện, phường/xã
    const provinceName = address.province || address.city || '';
    const districtName = address.district || '';
    const wardName = address.ward || '';
    
    console.log('Thông tin địa chỉ:', {
      province: provinceName,
      district: districtName,
      ward: wardName
    });
    
    // Cập nhật select box tỉnh/thành phố
    const provinceSelect = document.getElementById('province') as HTMLSelectElement;
    if (provinceSelect) {
      let foundProvince = false;
      for (let i = 0; i < provinceSelect.options.length; i++) {
        if (provinceSelect.options[i].text.trim().toLowerCase() === provinceName.trim().toLowerCase()) {
          provinceSelect.selectedIndex = i;
          foundProvince = true;
          console.log('Đã tìm thấy tỉnh/thành phố:', provinceSelect.options[i].text);
          break;
        }
      }
      if (!foundProvince && provinceSelect.options.length > 0) {
        // Nếu không tìm thấy, chọn "Tỉnh/Thành phố khác"
        for (let i = 0; i < provinceSelect.options.length; i++) {
          if (provinceSelect.options[i].value === 'Other') {
            provinceSelect.selectedIndex = i;
            console.log('Không tìm thấy tỉnh/thành phố, chọn "Tỉnh/Thành phố khác"');
            break;
          }
        }
      }
    }

    // Cập nhật select box quận/huyện
    setTimeout(() => {
      const districtSelect = document.getElementById('district') as HTMLSelectElement;
      if (districtSelect) {
        let foundDistrict = false;
        for (let i = 0; i < districtSelect.options.length; i++) {
          if (districtSelect.options[i].text.trim().toLowerCase() === districtName.trim().toLowerCase()) {
            districtSelect.selectedIndex = i;
            foundDistrict = true;
            console.log('Đã tìm thấy quận/huyện:', districtSelect.options[i].text);
            break;
          }
        }
        if (!foundDistrict && districtSelect.options.length > 1) {
          // Chọn option đầu tiên sau option disabled
          districtSelect.selectedIndex = 1;
        }
      }

      // Cập nhật select box phường/xã
      const wardSelect = document.getElementById('ward') as HTMLSelectElement;
      if (wardSelect) {
        let foundWard = false;
        for (let i = 0; i < wardSelect.options.length; i++) {
          if (wardSelect.options[i].text.trim().toLowerCase() === wardName.trim().toLowerCase()) {
            wardSelect.selectedIndex = i;
            foundWard = true;
            console.log('Đã tìm thấy phường/xã:', wardSelect.options[i].text);
            break;
          }
        }
        if (!foundWard && wardSelect.options.length > 1) {
          // Chọn option đầu tiên sau option disabled
          wardSelect.selectedIndex = 1;
        }
      }
    }, 100);
    
    // Đóng modal
    this.addressModal.hide();
    
    // Thông báo chọn địa chỉ thành công
    this.showNotification('Đã chọn địa chỉ giao hàng', 'success');
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message: message,
      type: type
    };

    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  public formatAddressFromParts(addressDetail: string, ward: string, district: string, province: string): string {
    const parts = [addressDetail, ward, district, province].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
}