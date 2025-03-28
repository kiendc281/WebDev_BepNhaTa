import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NewsletterResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private apiUrl = `${environment.apiUrl}/newsletter`;

  constructor(private http: HttpClient) { }

  /**
   * Đăng ký nhận thông tin qua email
   * @param email - Email người dùng đăng ký
   * @param source - Nguồn đăng ký (footer, popup, v.v.)
   * @returns Observable với kết quả đăng ký
   */
  subscribe(email: string, source: string = 'footer'): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(`${this.apiUrl}/subscribe`, {
      email,
      source,
      message: 'Đăng ký nhận thông tin từ Bếp Nhà Ta'
    });
  }

  /**
   * Chuyển tiếp email đăng ký đến email liên hệ
   * @param email - Email người dùng đăng ký
   * @param message - Nội dung tin nhắn (tuỳ chọn)
   * @returns Observable với kết quả gửi email
   */
  forwardToContact(email: string, message: string = 'Đăng ký nhận thông tin từ Bếp Nhà Ta'): Observable<NewsletterResponse> {
    return this.http.post<NewsletterResponse>(`${this.apiUrl}/forward-to-contact`, {
      email,
      message
    });
  }
} 