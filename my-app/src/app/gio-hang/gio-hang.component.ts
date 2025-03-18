import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/cart.interface';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
      console.log('Đã hủy đăng ký theo dõi giỏ hàng');
    }
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
    
    if (quantity <= 0) {
      this.removeItem(item);
    } else {
      this.cartService.updateQuantity(item.productId, item.servingSize, quantity).subscribe(cart => {
        console.log('Đã cập nhật số lượng thành công:', cart);
      });
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.productId, item.servingSize).subscribe(cart => {
      console.log('Đã xóa sản phẩm khỏi giỏ hàng');
    });
  }

  clearCart(): void {
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
  }
}