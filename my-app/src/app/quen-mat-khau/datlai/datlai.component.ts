import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-datlai',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  providers: [PasswordResetService],
  templateUrl: './datlai.component.html',
  styleUrls: ['./datlai.component.css'],
})
export class DatlaiComponent {
  @Input() emailOrPhone: string = '';
  @Input() resetToken: string = '';
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();
  @Output() resetSuccess = new EventEmitter<void>();

  resetForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordIcon = '../../../assets/sign in up/clarity-eye-hide-line.svg';
  confirmPasswordIcon = '../../../assets/sign in up/clarity-eye-hide-line.svg';

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService
  ) {
    this.resetForm = this.fb.group(
      {
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
    return this.resetForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetForm.valid) {
      this.loading = true;
      const newPassword = this.resetForm.value.password;

      this.passwordResetService.resetPassword(this.emailOrPhone, this.resetToken, newPassword).subscribe({
        next: (response) => {
          console.log('Password reset successfully');
          this.loading = false;
          this.successMessage = 'Đặt lại mật khẩu thành công!';
          setTimeout(() => {
            this.resetSuccess.emit();
            this.backToLogin.emit();
          }, 1500);
        },
        error: (error) => {
          console.error('Error resetting password:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
        }
      });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword
      ? '../../../assets/sign in up/unhide.svg'
      : '../../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.confirmPasswordIcon = this.showConfirmPassword
      ? '../../../assets/sign in up/unhide.svg'
      : '../../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToLogin.emit();
  }
}
