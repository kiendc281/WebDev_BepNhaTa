import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dang-ky',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dang-ky.component.html',
  styleUrls: ['./dang-ky.component.css'],
  providers: [AuthService]
})
export class DangKyComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  registerForm: FormGroup;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  confirmPasswordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', Validators.required],
        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?:\+84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[1-9]|9[0-4|6-9])[0-9]{7}$/
            ),
          ],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue]
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
  }

  // Custom validator for password match
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // Getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    console.log('Form values:', this.registerForm.value);
    console.log('Form valid:', this.registerForm.valid);

    if (this.registerForm.valid) {
      // Chỉ lấy 4 trường cần thiết cho API
      const userData = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        phone: this.registerForm.value.phone,
        password: this.registerForm.value.password
      };

      console.log('Dữ liệu gửi lên server:', userData);

      this.authService.register(userData).subscribe({
        next: (response) => {
          console.log('Đăng ký thành công:', response);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.account));
          
          // Thay vì chuyển hướng đến trang đăng nhập, emit sự kiện để chuyển sang popup đăng nhập
          this.switchToLogin.emit();
        },
        error: (error) => {
          console.error('Lỗi đăng ký:', error);
          this.errorMessage = error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        }
      });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword
      ? '../../assets/sign in up/unhide.svg'
      : '../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.confirmPasswordIcon = this.showConfirmPassword
      ? '../../assets/sign in up/unhide.svg'
      : '../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  navigateToLogin() {
    this.switchToLogin.emit();
  }

  onClose() {
    this.closePopup.emit();
  }
}
