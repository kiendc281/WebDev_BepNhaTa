import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css'
})
export class DangNhapComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  eyeIcon = '../../assets/images/clarity-eye-hide-line.svg';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', Validators.required],
    });
  }

  // Custom validator for email or phone
  emailOrPhoneValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    // Check if input is email
    const emailRegex = /^\S+@\S+\.\S+$/;
    const phoneRegex =
      /^(?:\+84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[1-9]|9[0-4|6-9])[0-9]{7}$/;

    if (value.includes('@')) {
      return emailRegex.test(value) ? null : { invalidEmail: true };
    } else {
      return phoneRegex.test(value) ? null : { invalidPhone: true };
    }
  }

  // Getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.valid) {
      this.loading = true;
      const { emailOrPhone, password } = this.loginForm.value;

      this.authService.login(emailOrPhone, password).subscribe({
        next: (response) => {
          console.log('Đăng nhập thành công:', response);
          
          // Kiểm tra quyền admin
          if (response.account.role !== 'admin') {
            this.loading = false;
            this.errorMessage = 'Tài khoản không có quyền truy cập trang quản trị';
            return;
          }
          
          // Lưu thông tin đăng nhập với thời hạn 1 giờ
          this.authService.saveToken(response.token);
          localStorage.setItem('admin_user', JSON.stringify(response.account));

          // Hiển thị thông báo thành công
          this.loading = false;
          this.successMessage = 'Đăng nhập thành công!';

          // Đợi 1.5 giây rồi chuyển hướng đến trang quản trị
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          console.error('Lỗi đăng nhập:', error);
          this.loading = false;
          if (error.status === 0) {
            this.errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
          } else {
            this.errorMessage = error.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
          }
        },
      });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.eyeIcon = this.showPassword
      ? '../../assets/images/unhide.svg'
      : '../../assets/images/clarity-eye-hide-line.svg';
  }
}
