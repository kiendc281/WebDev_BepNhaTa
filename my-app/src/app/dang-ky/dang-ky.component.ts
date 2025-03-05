import { Component, ViewChild, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dang-ky',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dang-ky.component.html',
  styleUrls: ['./dang-ky.component.css'],
})
export class DangKyComponent {
  @ViewChild('registerForm') registerForm!: NgForm;
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  userData = {
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  };

  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';
  confirmPasswordIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';

  // Error messages
  emailError = '';
  phoneError = '';
  passwordError = '';
  confirmPasswordError = '';

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

  validatePassword(password: string): boolean {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return passwordRegex.test(password);
  }

  onSubmit() {
    this.submitted = true;
    this.emailError = '';
    this.phoneError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    let isValid = true;

    // Validate email
    if (!this.validateEmail(this.userData.email)) {
      this.emailError = 'Email không hợp lệ';
      isValid = false;
    }

    // Validate phone
    if (!this.validatePhone(this.userData.phone)) {
      this.phoneError = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    if (!this.validatePassword(this.userData.password)) {
      this.passwordError =
        'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa, số và ký tự đặc biệt';
      isValid = false;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.confirmPasswordError = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    if (this.registerForm.valid && isValid) {
      console.log('Form submitted:', this.userData);
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
