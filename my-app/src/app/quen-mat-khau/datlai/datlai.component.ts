import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datlai',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datlai.component.html',
  styleUrls: ['./datlai.component.css'],
})
export class DatlaiComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();

  resetForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.resetForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
    });
  }

  // Getter for easy access to form fields
  get f() {
    return this.resetForm.controls;
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

  onSubmit() {
    this.submitted = true;

    if (this.resetForm.valid) {
      console.log('Form submitted:', this.resetForm.value);
      // Thêm logic xử lý đặt lại mật khẩu ở đây
    }
  }

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToLogin.emit();
  }
}
