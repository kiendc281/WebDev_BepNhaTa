import { Component, ViewChild, EventEmitter, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css',
})
export class DangNhapComponent {
  @ViewChild('loginForm') loginForm!: NgForm;
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  email: string = '';
  pass: string = '';
  submitted: boolean = false;
  showPassword: boolean = false;
  eyeIcon: string = '../../assets/sign in up/clarity-eye-hide-line.svg';
  emailError: string = '';

  constructor(private router: Router) {}

  validateEmail(email: string): boolean {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex =
      /^(?:\+84|0)(3[2-9]|5[6-9]|7[0|6-9]|8[1-9]|9[0-4|6-9])[0-9]{7}$/;
    return phoneRegex.test(phone);
  }

  onSubmit() {
    this.submitted = true;
    this.emailError = '';

    let isValid = true;

    // Check if input is empty
    if (!this.email) {
      this.emailError = 'Vui lòng nhập Email hoặc SĐT của bạn';
      isValid = false;
    } else {
      // Check if input is email
      if (this.email.includes('@')) {
        if (!this.validateEmail(this.email)) {
          this.emailError = 'Email không hợp lệ';
          isValid = false;
        }
      }
      // Check if input is phone number
      else {
        if (!this.validatePhone(this.email)) {
          this.emailError = 'Số điện thoại không hợp lệ';
          isValid = false;
        }
      }
    }

    if (this.loginForm.valid && isValid) {
      // Handle form submission
      console.log('Form submitted', this.email, this.pass);
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

  onClose() {
    this.closePopup.emit();
  }
}
