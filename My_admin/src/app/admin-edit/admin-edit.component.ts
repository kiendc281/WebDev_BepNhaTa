import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { Admin } from '../models/admin.interface';

@Component({
  selector: 'app-admin-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-edit.component.html',
  styleUrls: ['./admin-edit.component.css'],
})
export class AdminEditComponent implements OnInit {
  admin: Admin | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  success: boolean = false;

  // Validation patterns
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phonePattern = /^0\d{9}$/;

  // Validation states
  isEmailValid: boolean = true;
  isPhoneValid: boolean = true;

  // Form field states
  touchedFields = {
    email: false,
    name: false,
    phone: false,
    birthOfDate: false,
    gender: false,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAdmin(id);
    }
  }

  loadAdmin(id: string): void {
    this.isLoading = true;
    this.error = null;
    this.adminService.getAdmin(id).subscribe({
      next: (data) => {
        this.admin = data;
        console.log('Loaded admin data:', this.admin);
        console.log(
          'Gender value:',
          this.admin.gender,
          'Type:',
          typeof this.admin.gender
        );

        // Force update if gender is not a string or not 'male'/'female'
        if (this.admin.gender !== 'male' && this.admin.gender !== 'female') {
          console.log('Fixing invalid gender value:', this.admin.gender);
          this.admin.gender = this.admin.gender === 'Nữ' ? 'female' : 'male';
          console.log('Corrected gender value:', this.admin.gender);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin:', error);
        this.error = 'Không thể tải thông tin admin. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
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

  onFieldBlur(field: keyof typeof this.touchedFields): void {
    this.touchedFields[field] = true;
  }

  isFieldInvalid(field: keyof typeof this.touchedFields): boolean {
    return this.touchedFields[field] && !this.admin?.[field];
  }

  onSubmit(): void {
    if (!this.admin) {
      this.error = 'Không tìm thấy thông tin admin.';
      return;
    }

    // Mark all fields as touched
    Object.keys(this.touchedFields).forEach((key) => {
      this.touchedFields[key as keyof typeof this.touchedFields] = true;
    });

    // Validate before submitting
    this.validateEmail(this.admin.email);
    this.validatePhone(this.admin.phone);

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

    if (!this.isEmailValid || !this.isPhoneValid) {
      this.error = 'Vui lòng kiểm tra lại định dạng email và số điện thoại.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = false;

    // Create update data object with only the fields that have changed
    const updateData = {
      email: this.admin.email,
      name: this.admin.name,
      phone: this.admin.phone,
      birthOfDate: this.admin.birthOfDate,
      gender: this.admin.gender,
      role: 'admin', // Ensure role is set to admin
    };

    console.log('Admin ID:', this.admin._id);
    console.log('Updating admin with data:', updateData);

    this.adminService.updateAdmin(this.admin._id, updateData).subscribe({
      next: (response) => {
        console.log('Update successful:', response);
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error updating admin:', error);
        this.error =
          error.message ||
          'Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.';
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
