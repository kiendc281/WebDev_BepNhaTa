import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private apiUrl = 'http://localhost:3000/api'; // URL của API backend

  constructor(private http: HttpClient) { }

  // Gửi mã OTP
  sendOTP(emailOrPhone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp`, { emailOrPhone });
  }

  // Xác thực mã OTP
  verifyOTP(emailOrPhone: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { emailOrPhone, otp });
  }

  // Đặt lại mật khẩu
  resetPassword(emailOrPhone: string, resetToken: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      emailOrPhone,
      resetToken,
      newPassword
    });
  }
}
