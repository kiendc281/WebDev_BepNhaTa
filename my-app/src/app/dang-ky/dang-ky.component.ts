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
import { OtpVerificationComponent } from './xac-thuc-otp/otp-verification.component';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-dang-ky',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, OtpVerificationComponent],
  templateUrl: './dang-ky.component.html',
  styleUrls: ['./dang-ky.component.css'],
  providers: [AuthService]
})
export class DangKyComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  registerForm: FormGroup;
  submitted = false;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  confirmPasswordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  errorMessage: string = '';
  
  // Add notification and OTP verification state
  notification: Notification = {
    show: false,
    message: '',
    type: 'success'
  };
  showOtpVerification = false;
  registrationData: any = null;

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

  // Method to show notifications
  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message,
      type,
    };

    // Automatically hide notification after 3 seconds
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
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
      this.loading = true;
      
      // Prepare user data for registration
      const userData = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        phone: this.registerForm.value.phone,
        password: this.registerForm.value.password
      };

      console.log('Dữ liệu chuẩn bị gửi lên server:', userData);

      // Check if the email is already registered (for better UX)
      this.checkIfEmailExists(userData.email).then(exists => {
        if (exists) {
          this.loading = false;
          this.errorMessage = 'Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.';
          this.showNotification(this.errorMessage, 'error');
          return;
        }

        // Request OTP for verification
        this.requestOtp(userData);
      });
    }
  }

  // Check if email exists (simplified for now)
  private async checkIfEmailExists(email: string): Promise<boolean> {
    // This is a placeholder - in actual implementation, you'd check with the server
    // For now, we'll assume email doesn't exist
    return false;
  }

  // Request OTP
  private requestOtp(userData: any) {
    this.authService.requestOTP(userData.email, userData.name).subscribe({
      next: (response) => {
        this.loading = false;
        this.registrationData = userData;
        this.showOtpVerification = true;
        this.showNotification('Mã OTP đã được gửi đến email của bạn!', 'success');
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi yêu cầu OTP:', error);
        
        // Handle specific error cases
        if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (error.status === 404) {
          // This is the current error - let's provide a helpful message
          this.errorMessage = 'Tính năng xác thực OTP đang được phát triển. Bạn vẫn có thể tiếp tục để kiểm tra giao diện.';
        } else {
          this.errorMessage = error.error?.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.';
        }
        
        this.showNotification(this.errorMessage, 'error');
        
        // For development, allow user to proceed to OTP screen despite errors
        if (error.status === 404) {
          setTimeout(() => {
            this.registrationData = userData;
            this.showOtpVerification = true;
          }, 2000);
        }
      }
    });
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

  // Handle OTP verification success
  onVerificationSuccess() {
    this.showNotification('Đăng ký thành công!', 'success');
    setTimeout(() => {
      this.switchToLogin.emit();
    }, 1500);
  }

  // Close OTP verification popup
  onCloseOtpVerification() {
    this.showOtpVerification = false;
  }
}
