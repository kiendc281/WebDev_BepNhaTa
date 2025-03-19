import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
<<<<<<< HEAD
import { CartManagerService } from '../services/cart-manager.service';
=======
import { CartService } from '../services/cart.service';
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css'
})
export class DangNhapComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();
  @Output() switchToForgotPass = new EventEmitter<void>();

  loginForm: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  eyeIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
<<<<<<< HEAD
    private cartService: CartManagerService
=======
    private cartService: CartService
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
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
<<<<<<< HEAD
          
          // Không cần lưu token và user ở đây vì đã được xử lý trong authService.login
=======
          // Lưu thông tin đăng nhập với thời hạn 1 giờ
          this.authService.saveToken(response.token);
          localStorage.setItem('user', JSON.stringify(response.account));

>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
          console.log('Token đã được lưu, bắt đầu đồng bộ giỏ hàng...');
          
          // Kiểm tra giỏ hàng hiện tại trong localStorage
          const localCart = localStorage.getItem('cart');
          console.log('Giỏ hàng hiện tại trong localStorage trước khi đồng bộ:', localCart);
          
          // Merge cart from local storage with server cart
          this.cartService.mergeCartsAfterLogin().subscribe({
            next: (cart) => {
              console.log('Giỏ hàng đã được đồng bộ thành công:', cart);
              
              // Hiển thị thông báo thành công
              this.loading = false;
              this.successMessage = 'Đăng nhập thành công!';
              
              // Đợi 1.5 giây rồi đóng popup và chuyển hướng
              setTimeout(() => {
                this.onClose();
                // Tải lại trang để đảm bảo giỏ hàng được cập nhật đúng
                window.location.href = '/';
              }, 1500);
            },
            error: (error) => {
              console.error('Lỗi khi đồng bộ giỏ hàng:', error);
              // Vẫn tiếp tục đăng nhập thành công dù có lỗi giỏ hàng
              this.loading = false;
              this.successMessage = 'Đăng nhập thành công!';
              
              setTimeout(() => {
                this.onClose();
                this.router.navigate(['/']);
              }, 1500);
            }
          });
        },
        error: (error) => {
          console.error('Lỗi đăng nhập:', error);
          this.loading = false;
          if (error.status === 0) {
            this.errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
          } else if (error.status === 401) {
            this.errorMessage = 'Email/Số điện thoại hoặc mật khẩu không đúng';
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
      ? '../../assets/sign in up/unhide.svg'
      : '../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  navigateToRegister() {
    this.switchToRegister.emit();
  }

  navigateToForgotPass() {
    this.switchToForgotPass.emit();
  }

  onClose() {
    this.closePopup.emit();
  }
}