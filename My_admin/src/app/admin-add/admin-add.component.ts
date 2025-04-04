import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { Admin } from '../models/admin.interface';

@Component({
  selector: 'app-admin-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-add.component.html',
  styleUrl: './admin-add.component.css',
})
export class AdminAddComponent {
  admin: Omit<Admin, '_id'> = {
    email: '',
    password: '',
    name: '',
    phone: '',
    birthOfDate: '',
    gender: 'male',
    role: 'admin',
  };
  isLoading: boolean = false;
  error: string | null = null;
  success: boolean = false;
  showPassword: boolean = false;

  // Validation patterns
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phonePattern = /^0\d{9}$/;
  passwordPattern =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;

  // Validation states
  isEmailValid: boolean = true;
  isPhoneValid: boolean = true;
  isPasswordValid: boolean = true;

  // Password validation states
  passwordValidation = {
    hasMinLength: false,
    hasNumber: false,
    hasUpperCase: false,
    hasSpecialChar: false,
  };

  // Form field states
  touchedFields = {
    email: false,
    password: false,
    name: false,
    phone: false,
    birthOfDate: false,
    gender: false,
  };

  constructor(private adminService: AdminService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  validateEmail(email: string): void {
    this.isEmailValid = this.emailPattern.test(email);
    if (this.isEmailValid) {
      this.error = null;
    }
  }

  validatePhone(phone: string): void {
    this.isPhoneValid = this.phonePattern.test(phone);
    if (this.isPhoneValid) {
      this.error = null;
    }
  }

  validatePassword(password: string): void {
    // Kiểm tra độ dài tối thiểu
    this.passwordValidation.hasMinLength = password.length >= 8;

    // Kiểm tra có chứa số
    this.passwordValidation.hasNumber = /\d/.test(password);

    // Kiểm tra có chứa chữ hoa
    this.passwordValidation.hasUpperCase = /[A-Z]/.test(password);

    // Kiểm tra có chứa ký tự đặc biệt
    this.passwordValidation.hasSpecialChar = /[!@#$%^&*]/.test(password);

    // Mật khẩu hợp lệ khi thỏa mãn tất cả điều kiện
    this.isPasswordValid =
      this.passwordValidation.hasMinLength &&
      this.passwordValidation.hasNumber &&
      this.passwordValidation.hasUpperCase &&
      this.passwordValidation.hasSpecialChar;

    if (this.isPasswordValid) {
      this.error = null;
    }
  }

  onFieldBlur(field: keyof typeof this.touchedFields): void {
    this.touchedFields[field] = true;
  }

  isFieldInvalid(field: keyof typeof this.touchedFields): boolean {
    return this.touchedFields[field] && !this.admin[field];
  }

  isPasswordInvalid(): boolean {
    return (
      (this.touchedFields['password'] && !this.admin.password) ||
      (!this.isPasswordValid && this.admin.password.length > 0)
    );
  }

  onSubmit(): void {
    // Mark all fields as touched
    Object.keys(this.touchedFields).forEach((key) => {
      this.touchedFields[key as keyof typeof this.touchedFields] = true;
    });

    // Validate before submitting
    this.validateEmail(this.admin.email);
    this.validatePhone(this.admin.phone);
    this.validatePassword(this.admin.password);

    // Check if any required field is empty
    const emptyFields = Object.entries(this.admin)
      .filter(([key, value]) => {
        const field = key as keyof typeof this.touchedFields;
        return this.touchedFields[field] && !value;
      })
      .map(([key]) => {
        switch (key) {
          case 'email':
            return 'Email';
          case 'password':
            return 'Mật khẩu';
          case 'name':
            return 'Họ và tên';
          case 'phone':
            return 'Số điện thoại';
          case 'birthOfDate':
            return 'Ngày sinh';
          case 'gender':
            return 'Giới tính';
          default:
            return key;
        }
      });

    if (emptyFields.length > 0) {
      this.error = `Vui lòng điền đầy đủ thông tin: ${emptyFields.join(', ')}`;
      return;
    }

    if (!this.isEmailValid || !this.isPhoneValid || !this.isPasswordValid) {
      this.error =
        'Vui lòng kiểm tra lại định dạng email, số điện thoại và mật khẩu.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = false;

    this.adminService.createAdmin(this.admin).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error creating admin:', error);
        this.error = error.message;
        this.isLoading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin']);
  }

  onBack(): void {
    this.router.navigate(['/admin']);
  }
}
