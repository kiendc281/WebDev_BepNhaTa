import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Address {
  _id: string;
  accountId: string;
  recipientName?: string;
  recipientPhone?: string;
  email?: string;
  province?: string;
  city?: string;  // Include 'city' property for backward compatibility
  district?: string;
  ward?: string;
  address?: string;
  detail?: string; // Include 'detail' property for backward compatibility
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Lấy danh sách địa chỉ của người dùng
   */
  getUserAddresses(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    // Lấy userId từ user hiện tại
    const user = this.authService.getCurrentUser();
    const userId = user?._id || user?.id;
    
    console.log('Đang lấy địa chỉ cho tài khoản:', userId);
    
    // Sử dụng userId để gọi API
    return this.http.get(`${this.apiUrl}/addresses/account/${userId}`, { headers });
  }

  /**
   * Lấy chi tiết địa chỉ
   */
  getAddressById(addressId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/addresses/${addressId}`, { headers });
  }

  /**
   * Tạo địa chỉ mới
   */
  addAddress(addressData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/addresses`, addressData, { headers });
  }

  /**
   * Cập nhật địa chỉ
   */
  updateAddress(addressId: string, addressData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/addresses/${addressId}`, addressData, { headers });
  }

  /**
   * Xóa địa chỉ
   */
  deleteAddress(addressId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/addresses/${addressId}`, { headers });
  }

  /**
   * Thiết lập địa chỉ mặc định
   */
  setDefaultAddress(addressId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/addresses/${addressId}/default`, {}, { headers });
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