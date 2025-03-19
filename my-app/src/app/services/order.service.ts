import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cart.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/cart/orders`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Tạo đơn hàng mới (cho cả khách và người dùng đăng nhập)
   */
  createOrder(orderData: any): Observable<any> {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    // Thêm token nếu đã đăng nhập
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Xác định endpoint dựa vào loại đơn hàng (guest hoặc user)
    // Sử dụng endpoint chung 'orders' cho cả 2 loại đơn hàng
    const endpoint = 'orders';
    
    console.log('Đang gửi đơn hàng tới endpoint:', `${environment.apiUrl}/${endpoint}`);
    
    // Gửi request đến server
    return this.http.post(`${environment.apiUrl}/${endpoint}`, orderData, { headers });
  }

  /**
   * Chuẩn bị dữ liệu đơn hàng cho khách
   */
  prepareGuestOrderData(
    cartItems: CartItem[], 
    totalPrice: number,
    formData: {
      fullName: string,
      phone: string,
      email: string,
      address: string,
      note?: string
    },
    paymentMethod: string
  ): any {
    // Đảm bảo địa chỉ không bị undefined
    const address = formData.address || '';
    
    // Đảm bảo paymentMethod là chữ hoa để phù hợp với enum trong model
    const upperCasePaymentMethod = paymentMethod.toUpperCase();
    
    return {
      accountId: 'guest', // Add a dummy accountId for guest users
      itemOrder: this.formatCartItemsForOrder(cartItems),
      prePrice: totalPrice,
      discount: 0,
      shippingFee: 0,
      totalPrice: totalPrice,
      paymentMethod: upperCasePaymentMethod,
      guestInfo: {
        fullName: formData.fullName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        address: address,
        note: formData.note || ''
      }
    };
  }

  /**
   * Chuẩn bị dữ liệu đơn hàng cho người dùng đăng nhập
   */
  prepareUserOrderData(
    accountId: string,
    addressId: string,
    cartItems: CartItem[],
    totalPrice: number,
    paymentMethod: string
  ): any {
    // Đảm bảo paymentMethod là chữ hoa để phù hợp với enum trong model
    const upperCasePaymentMethod = paymentMethod.toUpperCase();
    
    return {
      accountId,
      addressId,
      itemOrder: this.formatCartItemsForOrder(cartItems),
      prePrice: totalPrice,
      discount: 0,
      shippingFee: 0,
      totalPrice: totalPrice,
      paymentMethod: upperCasePaymentMethod
    };
  }

  /**
   * Chuyển đổi định dạng CartItem sang định dạng itemOrder cho API
   */
  private formatCartItemsForOrder(cartItems: CartItem[]): any[] {
    return cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity
    }));
  }

  /**
   * Lấy lịch sử đơn hàng của người dùng
   */
  getUserOrders(accountId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/orders/account/${accountId}`, { headers });
  }

  /**
   * Lấy chi tiết đơn hàng
   */
  getOrderDetails(orderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/orders/${orderId}`, { headers });
  }

  /**
   * Hủy đơn hàng
   */
  cancelOrder(orderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${environment.apiUrl}/orders/${orderId}/cancel`, {}, { headers });
  }

  /**
   * Lấy headers có token xác thực
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);
  }
} 