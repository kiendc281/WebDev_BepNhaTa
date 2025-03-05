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

  constructor(private router: Router) {}

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.valid) {
      console.log('Form submitted:', this.userData);
      // Add your registration logic here
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
