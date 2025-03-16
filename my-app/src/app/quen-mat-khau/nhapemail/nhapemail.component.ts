import { Component, EventEmitter, Output } from '@angular/core';
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
  selector: 'app-nhapemail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './nhapemail.component.html',
  styleUrls: ['./nhapemail.component.css'],
})
export class NhapemailComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<string>();

  resetForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService
  ) {
    this.resetForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
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
    return this.resetForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.resetForm.valid) {
      this.loading = true;
      const emailOrPhone = this.resetForm.value.emailOrPhone;
      
      this.passwordResetService.sendOTP(emailOrPhone).subscribe({
        next: (response) => {
          console.log('OTP đã được gửi:', response);
          this.loading = false;
          this.nextStep.emit(emailOrPhone);
        },
        error: (error) => {
          console.error('Lỗi khi gửi OTP:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.';
        }
      });
    }
  }

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToLogin.emit();
  }
}
