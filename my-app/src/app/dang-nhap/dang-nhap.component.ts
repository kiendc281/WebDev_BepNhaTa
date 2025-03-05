import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css',
})
export class DangNhapComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  loginForm: FormGroup;
  submitted = false;
  showPassword = false;
  eyeIcon = '../../assets/sign in up/clarity-eye-hide-line.svg';

  constructor(private router: Router, private fb: FormBuilder) {
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

    if (this.loginForm.valid) {
      console.log('Form submitted:', this.loginForm.value);
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
