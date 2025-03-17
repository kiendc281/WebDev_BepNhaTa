import { Component, OnInit } from '@angular/core';
import { CartService, CartItem } from '../services/cart.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gio-hang',
  templateUrl: './gio-hang.component.html',
  styleUrls: ['./gio-hang.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class GioHangComponent implements OnInit {
  cartItems: (CartItem & { selected?: boolean })[] = [];
  total: number = 0;
  allItemsSelected: boolean = false;
  hasSelectedItems: boolean = false;
  discountCode: string = '';
  discountAmount: number = 0;
  shippingFee: number = 0;
  shippingMethod: string = 'free';
  paymentMethod: string = 'cod';
  customerInfo = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
    saveAddress: false
  };

  constructor(
    private cartService: CartService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.customerInfo.name = user.name || '';
        this.customerInfo.email = user.email || '';
        this.customerInfo.phone = user.phone || '';
        // Load saved address if available
      }
    }
  }

  loadCartItems(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items.map(item => ({
        ...item,
        selected: false
      }));
      this.calculateTotal();
      this.updateSelection();
    });
  }

  updateQuantity(item: CartItem & { selected?: boolean }, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }
    
    this.cartService.updateQuantity(item.product._id, item.serving, newQuantity);
    this.loadCartItems();
  }

  removeItem(item: CartItem & { selected?: boolean }): void {
    this.cartService.removeFromCart(item.product._id, item.serving);
    this.loadCartItems();
  }

  toggleSelectAll(): void {
    this.allItemsSelected = !this.allItemsSelected;
    this.cartItems.forEach(item => {
      item.selected = this.allItemsSelected;
    });
    this.updateSelection();
  }

  updateSelection(): void {
    const selectedCount = this.cartItems.filter(item => item.selected).length;
    this.hasSelectedItems = selectedCount > 0;
    this.allItemsSelected = selectedCount === this.cartItems.length && this.cartItems.length > 0;
  }

  removeSelectedItems(): void {
    const selectedItems = this.cartItems
      .filter(item => item.selected)
      .map(item => ({
        productId: item.product._id,
        serving: item.serving
      }));
    
    if (selectedItems.length === 0) return;
    
    this.cartService.removeSelectedItems(selectedItems);
    this.loadCartItems();
  }

  calculateTotal(): void {
    this.total = this.cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  applyVoucher(): void {
    if (!this.discountCode) {
      alert('Vui lòng nhập mã giảm giá');
      return;
    }
    
    // Simulate voucher processing - should be replaced with API call
    if (this.discountCode === 'WELCOME10') {
      this.discountAmount = this.total * 0.1; // 10% discount
      alert('Áp dụng mã giảm giá thành công!');
    } else if (this.discountCode === 'FREESHIP') {
      this.shippingFee = 0;
      alert('Áp dụng mã miễn phí vận chuyển thành công!');
    } else {
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      this.discountAmount = 0;
    }
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  validateForm(): boolean {
    if (!this.customerInfo.name) {
      alert('Vui lòng nhập họ và tên');
      return false;
    }
    if (!this.customerInfo.phone) {
      alert('Vui lòng nhập số điện thoại');
      return false;
    }
    if (!this.customerInfo.address) {
      alert('Vui lòng nhập địa chỉ giao hàng');
      return false;
    }
    if (!this.customerInfo.city || !this.customerInfo.district || !this.customerInfo.ward) {
      alert('Vui lòng chọn đầy đủ thông tin địa chỉ');
      return false;
    }
    return true;
  }

  checkout(): void {
    // Check if user is logged in before proceeding to checkout
    if (!this.authService.isLoggedIn()) {
      alert('Vui lòng đăng nhập để tiếp tục thanh toán');
      this.router.navigate(['/dang-nhap'], { queryParams: { returnUrl: '/gio-hang' } });
      return;
    }
    
    if (this.cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    // Save address if requested
    if (this.customerInfo.saveAddress) {
      // Save address to user profile
      console.log('Saving address for future use');
    }

    // Here we would typically make an API call to create an order
    const orderData = {
      items: this.cartItems,
      customer: this.customerInfo,
      paymentMethod: this.paymentMethod,
      total: this.total,
      discount: this.discountAmount,
      shippingFee: this.shippingFee,
      finalTotal: this.total - this.discountAmount + this.shippingFee
    };
    
    console.log('Placing order:', orderData);
    
    alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.');
    this.cartService.clearCart();
    this.loadCartItems();
    
    // Navigate to home page or order confirmation page
    this.router.navigate(['/']);
  }

  continueShopping(): void {
    this.router.navigate(['/san-pham']);
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.loadCartItems();
  }
}
