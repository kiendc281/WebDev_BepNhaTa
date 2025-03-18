  import { CommonModule } from '@angular/common';
  import { Component, OnInit } from '@angular/core';
  import { Router } from '@angular/router';
  import { AuthService } from '../services/auth.service';
  import { Account } from '../models/account.interface';
  import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
    ValidatorFn,
    AbstractControl,
    ValidationErrors,
  } from '@angular/forms';

  interface Toast {
    type: 'success' | 'error';
    title: string;
    message: string;
    fading?: boolean;
  }

  @Component({
    selector: 'app-tai-khoan',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './tai-khoan.component.html',
    styleUrls: ['./tai-khoan.component.css'],
  })
  export class TaiKhoanComponent implements OnInit {
    selectedCategory: string = 'thong-tin';
    currentUser: Account | null = null;

    // Biến quản lý trạng thái hiển thị modal
    showUpdateModal: boolean = false;
    showPasswordModal: boolean = false;

    // Form cập nhật thông tin
    updateForm: FormGroup;
    passwordForm: FormGroup;

    // Biến quản lý giới tính
    gender: string = 'Nam';

    // Mảng cho dropdown ngày, tháng, năm
    days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
    months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
    years: number[] = Array.from(
      { length: 80 },
      (_, i) => new Date().getFullYear() - i
    );

    selectedDay: number = 1;
    selectedMonth: number = 1;
    selectedYear: number = 2000;

    // Biến quản lý hiển thị mật khẩu
    showOldPassword: boolean = false;
    showNewPassword: boolean = false;
    showConfirmPassword: boolean = false;

    toasts: Toast[] = [];

    constructor(
      private authService: AuthService,
      private router: Router,
      private fb: FormBuilder
    ) {
      // Khởi tạo form thông tin cá nhân
      this.updateForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        day: [1],
        month: [1],
        year: [2000],
        gender: ['Nam'],
      });

      // Khởi tạo form cập nhật mật khẩu
      this.passwordForm = this.fb.group(
        {
          oldPassword: ['', Validators.required],
          newPassword: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              this.strongPasswordValidator,
            ],
          ],
          confirmPassword: ['', [Validators.required]],
        },
        {
          validators: this.passwordMatchValidator,
        }
      );
    }

    // Validator để kiểm tra mật khẩu mạnh
    strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

      const passwordValid = hasUpperCase && hasNumber && hasSpecialChar;

      return !passwordValid
        ? {
            strongPassword: {
              hasUpperCase: hasUpperCase,
              hasNumber: hasNumber,
              hasSpecialChar: hasSpecialChar,
            },
          }
        : null;
    }

    // Validator để kiểm tra mật khẩu xác nhận
    passwordMatchValidator: ValidatorFn = (
      control: AbstractControl
    ): ValidationErrors | null => {
      const newPassword = control.get('newPassword');
      const confirmPassword = control.get('confirmPassword');

      if (
        newPassword &&
        confirmPassword &&
        newPassword.value !== confirmPassword.value
      ) {
        confirmPassword.setErrors({ noMatch: true });
        return { passwordMismatch: true };
      }

      return null;
    };

    ngOnInit(): void {
      // Kiểm tra người dùng đã đăng nhập chưa
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/dang-nhap']);
        return;
      }

      // Lấy thông tin người dùng đăng nhập
      this.currentUser = this.authService.getCurrentUser();

      // Nếu không có thông tin người dùng, chuyển hướng đến trang đăng nhập
      if (!this.currentUser) {
        this.router.navigate(['/dang-nhap']);
        return;
      }

      // Điền thông tin vào form
      this.updateForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
      });

      // Set gender if available
      if (this.currentUser.gender) {
        this.gender = this.currentUser.gender;
        this.updateForm.patchValue({ gender: this.currentUser.gender });
      }

      // Set date if available
      if (this.currentUser.birthOfDate) {
        const birthDate = new Date(this.currentUser.birthOfDate);
        this.selectedDay = birthDate.getDate();
        this.selectedMonth = birthDate.getMonth() + 1;
        this.selectedYear = birthDate.getFullYear();

        this.updateForm.patchValue({
          day: this.selectedDay,
          month: this.selectedMonth,
          year: this.selectedYear,
        });
      }

      this.initPasswordForm();
      this.generateDaysInMonth();

      // Debug info
      console.log('Current user:', this.currentUser);
    }

    private initPasswordForm(): void {
      this.passwordForm = this.fb.group(
        {
          oldPassword: ['', [Validators.required]],
          newPassword: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              this.strongPasswordValidator,
            ],
          ],
          confirmPassword: ['', [Validators.required]],
        },
        { validators: this.passwordMatchValidator }
      );
    }

    showContent(category: string): void {
      this.selectedCategory = category;
    }

    logout(): void {
      this.authService.logout();
      this.router.navigate(['/trang-chu']);
    }

    // Mở modal cập nhật thông tin cá nhân
    openUpdateModal(): void {
      this.showUpdateModal = true;
    }

    // Đóng modal cập nhật thông tin cá nhân
    closeUpdateModal(): void {
      this.showUpdateModal = false;
    }

    // Mở modal cập nhật mật khẩu
    openPasswordModal(): void {
      this.showPasswordModal = true;
      this.passwordForm.reset();
    }

    // Đóng modal cập nhật mật khẩu
    closePasswordModal(): void {
      this.showPasswordModal = false;
    }

    // Chuyển đổi hiển thị mật khẩu
    togglePasswordVisibility(field: string): void {
      if (field === 'old') {
        this.showOldPassword = !this.showOldPassword;
      } else if (field === 'new') {
        this.showNewPassword = !this.showNewPassword;
      } else if (field === 'confirm') {
        this.showConfirmPassword = !this.showConfirmPassword;
      }
    }

    private showToast(type: 'success' | 'error', title: string, message: string) {
      const toast: Toast = { type, title, message };
      this.toasts.push(toast);

      // Auto remove after 3 seconds
      setTimeout(() => {
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
          this.toasts[index].fading = true;
          setTimeout(() => {
            this.toasts.splice(index, 1);
          }, 300);
        }
      }, 3000);
    }

    removeToast(index: number) {
      this.toasts[index].fading = true;
      setTimeout(() => {
        this.toasts.splice(index, 1);
      }, 300);
    }

    // Xử lý cập nhật thông tin cá nhân
    updateUserInfo(): void {
      if (this.updateForm.valid) {
        const formData = this.updateForm.value;
        const userId = (this.currentUser as any)?.id;

        if (userId) {
          this.authService.updateAccount(userId, formData).subscribe({
            next: (response) => {
              console.log('Cập nhật thông tin thành công:', response);
              this.closeUpdateModal();
              this.showToast(
                'success',
                'Thành công!',
                'Thông tin tài khoản đã được cập nhật'
              );
            },
            error: (error) => {
              console.error('Lỗi khi cập nhật thông tin:', error);
              this.showToast(
                'error',
                'Lỗi!',
                'Không thể cập nhật thông tin tài khoản'
              );
            },
          });
        }
      }
    }

    // Xử lý cập nhật mật khẩu
    updatePassword(): void {
      if (this.passwordForm.valid) {
        const passwordData = {
          oldPassword: this.passwordForm.value.oldPassword,
          newPassword: this.passwordForm.value.newPassword,
        };

        const userId = (this.currentUser as any)?.id;
        if (userId) {
          this.authService.updatePassword(userId, passwordData).subscribe({
            next: (response) => {
              console.log('Cập nhật mật khẩu thành công:', response);
              this.closePasswordModal();
              this.showToast(
                'success',
                'Thành công!',
                'Mật khẩu đã được cập nhật'
              );
            },
            error: (error) => {
              console.error('Lỗi khi cập nhật mật khẩu:', error);
              this.showToast(
                'error',
                'Lỗi!',
                error.error?.message || 'Vui lòng kiểm tra lại mật khẩu'
              );
            },
          });
        }
      }
    }

    // Format date of birth for display
    formatBirthDate(): string | null {
      if (!this.currentUser?.birthOfDate) {
        return null;
      }

      try {
        const birthDate = new Date(this.currentUser.birthOfDate);
        if (isNaN(birthDate.getTime())) {
          // Invalid date
          return null;
        }

        // Format as DD/MM/YYYY
        const day = birthDate.getDate().toString().padStart(2, '0');
        const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
        const year = birthDate.getFullYear();

        return `${day}/${month}/${year}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return null;
      }
    }

    // Chọn giới tính
    selectGender(gender: string): void {
      this.gender = gender;
      this.updateForm.patchValue({ gender });
    }

    generateDaysInMonth(): void {
      // Implementation of generateDaysInMonth method
    }
  }
