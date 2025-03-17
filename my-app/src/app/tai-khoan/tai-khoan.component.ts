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

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Khởi tạo form thông tin cá nhân
    this.updateForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
      day: [1],
      month: [1],
      year: [2000],
      gender: ['Nam'],
    });

    // Khởi tạo form cập nhật mật khẩu
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
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

    this.initPasswordForm();
    this.generateDaysInMonth();
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
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
    this.router.navigate(['/dang-nhap']);
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

  // Xử lý cập nhật thông tin cá nhân
  updateUserInfo(): void {
    if (this.updateForm.valid) {
      const formData = this.updateForm.value;

      // Cập nhật thông tin người dùng
      // Thông thường sẽ gọi API để cập nhật thông tin
      console.log('Cập nhật thông tin:', formData);

      // Cập nhật thông tin trong localStorage (tạm thời)
      const updatedUser: Account = {
        ...(this.currentUser as Account),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.currentUser = updatedUser;

      // Đóng modal
      this.showUpdateModal = false;
    }
  }

  // Xử lý cập nhật mật khẩu
  updatePassword(): void {
    if (this.passwordForm.invalid) {
      // Đánh dấu tất cả các trường là đã touched để hiển thị lỗi
      Object.keys(this.passwordForm.controls).forEach((key) => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const passwordData = {
      oldPassword: this.passwordForm.value.oldPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    console.log('Password update data:', passwordData);

    // Trong thực tế, bạn sẽ gọi API để cập nhật mật khẩu ở đây
    // this.authService.updatePassword(passwordData).subscribe(...)

    // Đóng modal sau khi cập nhật thành công
    this.closePasswordModal();

    // Hiển thị thông báo thành công (có thể thêm sau)
    alert('Cập nhật mật khẩu thành công!');
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
