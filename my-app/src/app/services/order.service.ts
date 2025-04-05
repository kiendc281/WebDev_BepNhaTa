import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CartItem } from '../models/cart.interface';
import { GuestCartService } from './guest-cart.service';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private guestCartService: GuestCartService
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
    const isGuestOrder = orderData.accountId === 'guest';
    
    // Đảm bảo mỗi item trong đơn hàng đều có đủ các trường bắt buộc
    if (orderData.itemOrder && Array.isArray(orderData.itemOrder)) {
      orderData.itemOrder = orderData.itemOrder.map((item: any) => {
        return {
          ...item,
          productId: item.productId,
          name: item.name || item.productName || 'Sản phẩm không tên',
          img: item.img || item.mainImage || item.image || '',
          quantity: item.quantity,
          servingSize: item.servingSize || 'Mặc định',
          totalPrice: item.totalPrice || (item.price * item.quantity)
        };
      });
    }
    
    // Đảm bảo orderData có đủ các trường bắt buộc theo yêu cầu của backend
    if (!orderData.prePrice) {
      orderData.prePrice = orderData.totalPrice;
    }
    
    if (!orderData.status) {
      orderData.status = 'Đang xử lý';
    }
    
    if (!orderData.discount) {
      orderData.discount = 0;
    }
    
    if (!orderData.shippingFee) {
      orderData.shippingFee = 0;
    }
    
    // Đảm bảo guestInfo có đủ thông tin nếu là đơn hàng khách
    if (isGuestOrder && orderData.guestInfo) {
      orderData.guestInfo = {
        ...orderData.guestInfo,
        fullName: orderData.guestInfo.fullName || '',
        phone: orderData.guestInfo.phone || '',
        email: orderData.guestInfo.email || '',
        address: orderData.guestInfo.address || '',
        note: orderData.guestInfo.note || ''
      };
    }
    
    console.log('Đang gửi đơn hàng tới endpoint:', `${environment.apiUrl}/${endpoint}`);
    console.log('Dữ liệu đơn hàng:', JSON.stringify(orderData));
    
    // Lưu lại cartItems để cập nhật kho sau khi đặt hàng thành công 
    // Chuẩn bị dữ liệu cập nhật kho cho tất cả các loại đơn hàng (cả guest và đăng nhập)
    const cartItems = [...this.formatCartItemsForInventory(orderData.itemOrder)];
    
    console.log('Chuẩn bị dữ liệu cập nhật kho:', cartItems);
    
    // Gửi request đến server
    return this.http.post<any>(`${environment.apiUrl}/${endpoint}`, orderData, { headers })
      .pipe(
        switchMap(response => {
          console.log('Phản hồi từ server:', response);
          
          // Cập nhật kho cho tất cả đơn hàng (cả guest và đăng nhập)
          if (response && response.data && response.data._id) {
            const orderId = response.data._id;
            console.log('Đơn hàng thành công, cập nhật kho với orderId:', orderId);
            console.log('Số lượng sản phẩm cần cập nhật kho:', cartItems.length);
            
            // Gọi API cập nhật kho
            return this.guestCartService.updateInventoryAfterOrder(orderId, cartItems)
              .pipe(
                tap(inventoryResponse => {
                  console.log('Kết quả cập nhật kho:', inventoryResponse);
                }),
                // Trả về kết quả đặt hàng ban đầu dù cập nhật kho thành công hay thất bại
                catchError(error => {
                  console.error('Lỗi khi cập nhật kho nhưng không ảnh hưởng đến đơn hàng:', error);
                  return of(response);
                }),
                // Luôn trả về response ban đầu (đặt hàng thành công)
                switchMap(() => of(response))
              );
          } else {
            console.log('Không cập nhật kho vì thiếu dữ liệu phản hồi');
          }
          
          // Trường hợp không có ID đơn hàng, chỉ trả về response ban đầu
          return of(response);
        })
      );
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
    
    // Đảm bảo mỗi item đều có đủ thông tin theo schema mới
    const itemsWithDetails = cartItems.map(item => {
      return {
        productId: item.productId,
        name: item.productName || item.ingredientName || 'Sản phẩm không tên',
        img: item.mainImage || '',
        servingSize: item.servingSize || 'Mặc định',
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
      };
    });
    
    return {
      accountId: 'guest', // Add a dummy accountId for guest users
      itemOrder: itemsWithDetails,
      prePrice: totalPrice,
      discount: 0,
      shippingFee: 0,
      totalPrice: totalPrice,
      paymentMethod: upperCasePaymentMethod,
      status: 'Đang xử lý',
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
    paymentMethod: string,
    addressDetails?: {
      recipientName: string,
      recipientPhone: string,
      address: string
    }
  ): any {
    // Đảm bảo paymentMethod là chữ hoa để phù hợp với enum trong model
    const upperCasePaymentMethod = paymentMethod.toUpperCase();
    
    // Đảm bảo mỗi item đều có đủ thông tin theo schema mới
    const itemsWithDetails = cartItems.map(item => {
      return {
        productId: item.productId,
        name: item.productName || item.ingredientName || 'Sản phẩm không tên',
        img: item.mainImage || '',
        servingSize: item.servingSize || 'Mặc định',
        quantity: item.quantity,
        totalPrice: item.price * item.quantity
      };
    });
    
    // Dữ liệu cơ bản của đơn hàng
    const orderData = {
      accountId,
      itemOrder: itemsWithDetails,
      prePrice: totalPrice,
      discount: 0,
      shippingFee: 0,
      totalPrice: totalPrice,
      paymentMethod: upperCasePaymentMethod,
      status: 'Đang xử lý'
    };

    // Nếu có addressId hợp lệ, sử dụng nó
    if (addressId && addressId !== 'placeholder-address-id') {
      return {
        ...orderData,
        addressId
      };
    }
    
    // Nếu không có addressId nhưng có thông tin địa chỉ chi tiết
    if (addressDetails) {
      return {
        ...orderData,
        guestInfo: {
          fullName: addressDetails.recipientName,
          phone: addressDetails.recipientPhone,
          address: addressDetails.address,
          email: '', // Có thể bổ sung sau
          note: ''  // Có thể bổ sung sau
        }
      };
    }
    
    // Trường hợp không có đủ thông tin
    return orderData;
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

  /**
   * Chuyển đổi định dạng sản phẩm đơn hàng thành format cho API cập nhật kho
   */
  private formatCartItemsForInventory(orderItems: any[]): CartItem[] {
    console.log('Chuyển đổi định dạng sản phẩm cho cập nhật kho:', orderItems);
    
    if (!orderItems || !Array.isArray(orderItems)) {
      console.error('orderItems không hợp lệ:', orderItems);
      return [];
    }
    
    const result = orderItems.map(item => {
      console.log('Xử lý sản phẩm cho cập nhật kho:', item);
      
      // Đảm bảo quantity là số dương
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      
      // Chuẩn hóa servingSize một cách triệt để
      let normalizedServingSize = item.servingSize || 'Mặc định';
      
      // Nếu servingSize chỉ có số, thêm chữ "người" vào
      if (normalizedServingSize && /^\d+$/.test(normalizedServingSize)) {
        normalizedServingSize = normalizedServingSize + ' người';
        console.log(`Phát hiện servingSize chỉ có số, đã chuyển thành: ${normalizedServingSize}`);
      }
      
      // Gỡ bỏ các ký tự đặc biệt và chuẩn hóa khoảng trắng
      normalizedServingSize = normalizedServingSize.trim();
      
      // Lọc bỏ các ký tự đặc biệt nếu có
      normalizedServingSize = normalizedServingSize.replace(/[^\w\sàáạảãăắằẳẵặâấầẩẫậèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ]/gi, '');
      
      // Xử lý đặc biệt cho tất cả các món ăn, không chỉ cho bún riêu
      const productName = (item.name || '').toLowerCase();
      
      // Nếu servingSize chứa số, thử khớp với "X người"
      const numMatch = normalizedServingSize.match(/(\d+)/);
      if (numMatch) {
        const numPeople = numMatch[1];
        // Nếu sản phẩm là bún thang, cần đảm bảo servingSize là số thuần túy để khớp với portion "2" hoặc "4"
        if (productName.includes('bún thang') || productName.includes('bun thang')) {
          normalizedServingSize = numPeople;
          console.log(`Phát hiện sản phẩm bún thang, điều chỉnh servingSize thành: ${normalizedServingSize}`);
        }
        // Cho các sản phẩm khác, thử định dạng "X người" 
        else if (numPeople) {
          // Nếu servingSize đã chứa từ "người", không cần thêm vào
          if (!normalizedServingSize.includes('người')) {
            normalizedServingSize = numPeople + ' người';
          }
          console.log(`Đã điều chỉnh servingSize thành: ${normalizedServingSize}`);
        }
      }

      // Thêm xử lý cho các kích thước chuẩn
      const sizeKeywords = {
        'nhỏ': ['nhỏ', 'small', 's'],
        'vừa': ['vừa', 'medium', 'm'],
        'lớn': ['lớn', 'large', 'l', 'xl']
      };
      
      // Chuẩn hóa kích thước
      for (const [size, keywords] of Object.entries(sizeKeywords)) {
        if (keywords.some(keyword => normalizedServingSize.toLowerCase().includes(keyword))) {
          // Đã có kích thước chuẩn trong servingSize, không cần điều chỉnh thêm
          console.log(`Phát hiện kích thước chuẩn "${size}" trong servingSize: ${normalizedServingSize}`);
          break;
        }
      }
      
      // Log chi tiết
      console.log(`Sản phẩm: ID=${item.productId}, Tên=${item.name}, SL=${quantity}`);
      console.log(`ServingSize: Gốc=[${item.servingSize}], Chuẩn hóa=[${normalizedServingSize}]`);
      
      return {
        productId: item.productId,
        quantity: quantity,
        servingSize: normalizedServingSize,
        price: item.totalPrice / quantity,
        productName: item.name || '',
        mainImage: item.img || '',
        selected: false
      } as CartItem;
    });
    
    console.log('Kết quả chuyển đổi cho cập nhật kho:', result);
    return result;
  }
} 