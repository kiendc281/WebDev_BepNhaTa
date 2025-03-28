import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NewsletterService } from '../services/newsletter.service';
import { of, catchError } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent {
  email: string = '';
  loading: boolean = false;
  success: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  private toastTimeout: any;

  constructor(private newsletterService: NewsletterService) {}

  showToast(type: 'success' | 'error', message?: string) {
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Set the appropriate flag
    if (type === 'success') {
      this.success = true;
      this.error = false;
    } else {
      this.error = true;
      this.success = false;
      this.errorMessage = message || 'Có lỗi xảy ra';
    }

    // Auto close after 3 seconds
    this.toastTimeout = setTimeout(() => {
      this.closeToast(type);
    }, 3000);
  }

  closeToast(type: 'success' | 'error') {
    if (type === 'success') {
      this.success = false;
    } else {
      this.error = false;
    }
  }

  subscribeNewsletter() {
    // Kiểm tra email hợp lệ
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.email) {
      this.showToast('error', 'Vui lòng nhập email');
      return;
    } else if (!emailRegex.test(this.email)) {
      this.showToast('error', 'Vui lòng nhập email hợp lệ');
      return;
    }

    this.loading = true;
    this.error = false;
    this.success = false;

    // Xử lý tạm thời khi API chưa hoàn thiện - giả lập thành công
    setTimeout(() => {
      console.log('Đăng ký nhận thông tin thành công (giả lập):', this.email);
      this.showToast('success');
      this.loading = false;
      this.email = ''; // Reset form
    }, 1500);

    /* 
    // Đoạn mã dưới đây sẽ được sử dụng khi API đã hoạt động
    this.newsletterService.subscribe(this.email)
      .pipe(
        catchError(error => {
          console.error('Lỗi khi đăng ký:', error);
          this.showToast('error', error.error?.message || 'Không thể đăng ký. Vui lòng thử lại sau.');
          this.loading = false;
          return of(null);
        })
      )
      .subscribe(response => {
        if (!response) return; // Nếu có lỗi, dừng xử lý
        
        console.log('Đăng ký nhận thông tin thành công:', response);
        
        // Chuyển tiếp đến email liên hệ
        this.newsletterService.forwardToContact(this.email)
          .pipe(
            catchError(forwardError => {
              console.error('Lỗi khi chuyển tiếp email:', forwardError);
              // Không hiển thị lỗi vì đăng ký vẫn thành công
              return of(null);
            })
          )
          .subscribe(forwardResponse => {
            if (forwardResponse) {
              console.log('Chuyển tiếp email thành công:', forwardResponse);
            }
          });
        
        this.showToast('success');
        this.loading = false;
        this.email = ''; // Reset form
      });
    */
  }
}
