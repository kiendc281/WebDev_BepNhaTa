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
import { Address, AddressService } from '../services/address.service';
import { OrderService } from '../services/order.service';
import { CartManagerService } from '../services/cart-manager.service';
import { Product } from '../models/product.interface';
import { Order } from '../models/order.interface';

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
  showAddressModal: boolean = false;
  showEditAddressModal: boolean = false;

  // Quản lý địa chỉ
  userAddresses: Address[] = [];
  loadingAddresses: boolean = false;
  selectedAddress: Address | null = null;

  // // Danh sách địa chỉ cho dropdown
  // provinces: any[] = [];
  // districts: any[] = [];
  // wards: any[] = [];
  // selectedProvince: string = '';
  // selectedDistrict: string = '';
  // selectedWard: string = '';

  // Quản lý đơn hàng
  loading = false;
  userOrders: Order[] = [];
  showOrderDetailModal = false;
  selectedOrder: Order | null = null;

  // Form địa chỉ
  addressForm: FormGroup;

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

  // Khai báo mảng để lưu trữ toast messages
  toasts: Toast[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private addressService: AddressService,
    private orderService: OrderService,
    private cartService: CartManagerService
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

    // Khởi tạo form địa chỉ
    this.addressForm = this.fb.group({
      recipientName: ['', Validators.required],
      recipientPhone: [
        '',
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
      province: ['', Validators.required],
      district: ['', Validators.required],
      ward: ['', Validators.required],
      detail: ['', Validators.required],
      isDefault: [false],
    });
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

    // Tải địa chỉ người dùng khi khởi tạo
    this.loadUserAddresses();

    // Debug info
    console.log('Current user:', this.currentUser);

    if (this.selectedCategory === 'lich-su') {
      this.loadUserOrders();
    }
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
    if (category === 'lich-su') {
      this.loadUserOrders();
    }
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

  // Method để hiển thị toast notification
  showToast(type: 'success' | 'error', title: string, message: string) {
    const toast: Toast = { type, title, message };
    this.toasts.push(toast);

    // Tự động xóa toast sau 3 giây
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

  // Method để xóa toast notification
  removeToast(index: number) {
    this.toasts[index].fading = true;
    setTimeout(() => {
      this.toasts.splice(index, 1);
    }, 300);
  }

  // Xử lý cập nhật thông tin cá nhân
  updateUserInfo(): void {
    // Đánh dấu tất cả các trường là đã touched để hiển thị lỗi
    Object.keys(this.updateForm.controls).forEach((key) => {
      const control = this.updateForm.get(key);
      control?.markAsTouched();
    });

    if (this.updateForm.valid) {
      const formData = this.updateForm.value;

      // Chuẩn bị dữ liệu ngày sinh
      const birthDate = new Date(
        formData.year,
        formData.month - 1,
        formData.day
      );

      // Chuẩn bị dữ liệu cập nhật
      const updateData: Partial<Account> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        birthOfDate: birthDate,
      };

      console.log('Dữ liệu cập nhật:', updateData);

      // Lấy ID người dùng hiện tại
      const userId = (this.currentUser as any)?.id;

      if (userId) {
        // Gọi service để cập nhật thông tin
        this.authService.updateAccount(userId, updateData).subscribe({
          next: (response) => {
            console.log('Cập nhật thành công:', response);
            // Cập nhật thông tin người dùng hiện tại
            this.currentUser = this.authService.getCurrentUser();
            // Đóng modal
            this.closeUpdateModal();
            // Hiển thị thông báo thành công bằng toast
            this.showToast(
              'success',
              'Thành công!',
              'Thông tin tài khoản đã được cập nhật'
            );
          },
          error: (error) => {
            console.error('Lỗi khi cập nhật:', error);
            // Hiển thị thông báo lỗi bằng toast
            this.showToast(
              'error',
              'Lỗi',
              'Email đã được được sử dụng. Vui lòng nhập Email khác!'
            );
          },
        });
      }
    } else {
      // Hiển thị thông báo lỗi khi form không hợp lệ
      this.showToast(
        'error',
        'Vui lòng nhập đầy đủ thông tin',
        'Bạn cần điền đầy đủ và chính xác các thông tin trước khi cập nhật'
      );
    }
  }

  // Xử lý cập nhật mật khẩu
  updatePassword(): void {
    // Đánh dấu tất cả các trường là đã touched để hiển thị lỗi
    Object.keys(this.passwordForm.controls).forEach((key) => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });

    if (this.passwordForm.valid) {
      const passwordData = {
        oldPassword: this.passwordForm.value.oldPassword,
        newPassword: this.passwordForm.value.newPassword,
      };

      // Lấy ID người dùng hiện tại
      const userId = (this.currentUser as any)?.id;

      if (userId) {
        this.authService.updatePassword(userId, passwordData).subscribe({
          next: (response) => {
            console.log('Cập nhật mật khẩu thành công:', response);
            // Đóng modal
            this.closePasswordModal();
            // Hiển thị thông báo thành công bằng toast
            this.showToast(
              'success',
              'Thành công!',
              'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.'
            );

            // Đăng xuất và chuyển hướng người dùng đến trang đăng nhập sau 2 giây
            setTimeout(() => {
              this.authService.logout();
              this.router.navigate(['/dang-nhap']);
            }, 2000);
          },
          error: (error) => {
            console.error('Lỗi khi cập nhật mật khẩu:', error);
            // Hiển thị thông báo lỗi bằng toast
            this.showToast(
              'error',
              'Lỗi!',
              error.error?.message ||
                'Mật khẩu cũ chưa đúng! Vui lòng kiểm tra lại mật khẩu'
            );
          },
        });
      }
    } else {
      // Hiển thị thông báo lỗi khi form không hợp lệ
      this.showToast(
        'error',
        'Vui lòng kiểm tra và nhập đầy đủ thông tin',
        'Bạn cần điền đầy đủ và chính xác các thông tin trước khi cập nhật mật khẩu'
      );
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

  // Thêm phương thức để điều hướng đến trang favorites
  navigateToFavorites(): void {
    this.router.navigate(['/yeu-thich']);
  }

  /**
   * Tải danh sách địa chỉ của người dùng
   */
  loadUserAddresses(): void {
    this.loadingAddresses = true;
    console.log('Bắt đầu tải danh sách địa chỉ...');

    this.addressService.getUserAddresses().subscribe({
      next: (response) => {
        console.log('Đã tải địa chỉ người dùng thành công:', response);
        if (response && response.data && Array.isArray(response.data)) {
          this.userAddresses = response.data;
          console.log(`Đã tìm thấy ${this.userAddresses.length} địa chỉ`);
        } else {
          this.userAddresses = [];
          console.warn(
            'Không tìm thấy địa chỉ nào hoặc dữ liệu không đúng định dạng'
          );
        }
        this.loadingAddresses = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải địa chỉ người dùng:', error);
        // Log thông tin chi tiết hơn về lỗi
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
        if (error.status) {
          console.error('HTTP Status:', error.status);
        }
        this.showToast(
          'error',
          'Lỗi',
          'Không thể tải danh sách địa chỉ. Vui lòng thử lại sau.'
        );
        this.loadingAddresses = false;
      },
    });
  }

  /**
   * Xử lý sự kiện khi chọn tỉnh/thành phố
   */
  onProvinceChange(): void {
    // Reset các giá trị của quận/huyện và phường/xã khi thay đổi tỉnh/thành phố
    this.addressForm.patchValue({
      district: '',
      ward: '',
    });
  }

  /**
   * Xử lý sự kiện khi chọn quận/huyện
   */
  onDistrictChange(): void {
    // Reset giá trị của phường/xã khi thay đổi quận/huyện
    this.addressForm.patchValue({
      ward: '',
    });
  }

  /**
   * Mở modal thêm địa chỉ mới
   */
  openAddressModal(): void {
    this.addressForm.reset({
      isDefault: false,
    });
    this.showAddressModal = true;
  }

  /**
   * Đóng modal thêm địa chỉ
   */
  closeAddressModal(): void {
    this.showAddressModal = false;
  }

  /**
   * Mở modal chỉnh sửa địa chỉ
   */
  openEditAddressModal(address: Address): void {
    this.selectedAddress = address;
    this.addressForm.patchValue({
      recipientName: address.recipientName || '',
      recipientPhone: address.recipientPhone || '',
      email: address.email || '',
      province: address.province || address.city || '',
      district: address.district || '',
      ward: address.ward || '',
      detail: address.detail || address.address || '',
      isDefault: address.isDefault,
    });
    this.showEditAddressModal = true;
  }

  /**
   * Đóng modal chỉnh sửa địa chỉ
   */
  closeEditAddressModal(): void {
    this.showEditAddressModal = false;
    this.selectedAddress = null;
  }

  /**
   * Thêm địa chỉ mới
   */
  addNewAddress(): void {
    if (this.addressForm.invalid) {
      // Đánh dấu tất cả các trường là đã chạm để hiển thị lỗi
      Object.keys(this.addressForm.controls).forEach((key) => {
        const control = this.addressForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user?._id || user?.id;

    if (!userId) {
      this.showToast(
        'error',
        'Lỗi',
        'Không thể xác định người dùng. Vui lòng đăng nhập lại.'
      );
      return;
    }

    const newAddress = {
      accountId: userId,
      recipientName: this.addressForm.value.recipientName,
      recipientPhone: this.addressForm.value.recipientPhone,
      email: this.addressForm.value.email || '',
      city: this.addressForm.value.province, // Backend yêu cầu city thay vì province
      district: this.addressForm.value.district,
      ward: this.addressForm.value.ward,
      detail: this.addressForm.value.detail, // Backend yêu cầu detail thay vì address
      isDefault: this.addressForm.value.isDefault,
    };

    this.addressService.addAddress(newAddress).subscribe({
      next: (response) => {
        console.log('Thêm địa chỉ thành công:', response);
        this.showToast(
          'success',
          'Thành công',
          'Đã thêm địa chỉ mới vào sổ địa chỉ'
        );
        this.closeAddressModal();
        this.loadUserAddresses(); // Tải lại danh sách địa chỉ
      },
      error: (error) => {
        console.error('Lỗi khi thêm địa chỉ mới:', error);
        let errorMessage = 'Không thể thêm địa chỉ. ';
        if (error.error?.message) {
          errorMessage += error.error.message;
        }
        this.showToast('error', 'Lỗi', errorMessage);
      },
    });
  }

  /**
   * Cập nhật địa chỉ
   */
  updateAddress(): void {
    if (this.addressForm.invalid || !this.selectedAddress) {
      // Đánh dấu tất cả các trường là đã chạm để hiển thị lỗi
      Object.keys(this.addressForm.controls).forEach((key) => {
        const control = this.addressForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const updatedAddress = {
      recipientName: this.addressForm.value.recipientName,
      recipientPhone: this.addressForm.value.recipientPhone,
      email: this.addressForm.value.email || '',
      city: this.addressForm.value.province, // Backend yêu cầu city thay vì province
      district: this.addressForm.value.district,
      ward: this.addressForm.value.ward,
      detail: this.addressForm.value.detail, // Backend yêu cầu detail thay vì address
      isDefault: this.addressForm.value.isDefault,
    };

    this.addressService
      .updateAddress(this.selectedAddress._id, updatedAddress)
      .subscribe({
        next: (response) => {
          console.log('Cập nhật địa chỉ thành công:', response);
          this.showToast('success', 'Thành công', 'Đã cập nhật địa chỉ');
          this.closeEditAddressModal();
          this.loadUserAddresses(); // Tải lại danh sách địa chỉ
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật địa chỉ:', error);
          let errorMessage = 'Không thể cập nhật địa chỉ. ';
          if (error.error?.message) {
            errorMessage += error.error.message;
          }
          this.showToast('error', 'Lỗi', errorMessage);
        },
      });
  }

  /**
   * Xóa địa chỉ
   */
  deleteAddress(addressId: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      this.addressService.deleteAddress(addressId).subscribe({
        next: (response) => {
          console.log('Xóa địa chỉ thành công:', response);
          this.showToast('success', 'Thành công', 'Đã xóa địa chỉ');
          this.loadUserAddresses(); // Tải lại danh sách địa chỉ
        },
        error: (error) => {
          console.error('Lỗi khi xóa địa chỉ:', error);
          let errorMessage = 'Không thể xóa địa chỉ. ';
          if (error.error?.message) {
            errorMessage += error.error.message;
          }
          this.showToast('error', 'Lỗi', errorMessage);
        },
      });
    }
  }

  /**
   * Đặt địa chỉ mặc định
   */
  setDefaultAddress(addressId: string): void {
    this.addressService.setDefaultAddress(addressId).subscribe({
      next: (response) => {
        console.log('Đặt địa chỉ mặc định thành công:', response);
        this.showToast('success', 'Thành công', 'Đã đặt địa chỉ mặc định');
        this.loadUserAddresses(); // Tải lại danh sách địa chỉ
      },
      error: (error) => {
        console.error('Lỗi khi đặt địa chỉ mặc định:', error);
        let errorMessage = 'Không thể đặt địa chỉ mặc định. ';
        if (error.error?.message) {
          errorMessage += error.error.message;
        }
        this.showToast('error', 'Lỗi', errorMessage);
      },
    });
  }

  /**
   * Format địa chỉ đầy đủ từ các thành phần
   */
  formatAddress(address: Address): string {
    const detail = address.detail || address.address || '';
    const ward = address.ward || '';
    const district = address.district || '';
    const province = address.province || address.city || '';

    const parts = [detail, ward, district, province].filter(
      (part) => part && part.trim() !== ''
    );
    return parts.join(', ');
  }

  /**
   * Tải danh sách đơn hàng của người dùng
   */
  async loadUserOrders(): Promise<void> {
    this.loading = true;
    try {
      if (!this.currentUser?.id) {
        console.error('No user ID found');
        return;
      }
      const response = await this.orderService
        .getUserOrders(this.currentUser.id)
        .toPromise();
      console.log('Order response:', response);
      if (response && response.data) {
        this.userOrders = response.data;
        console.log('Processed orders:', this.userOrders);
      } else {
        this.userOrders = [];
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showToast(
        'error',
        'Lỗi',
        'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.'
      );
    } finally {
      this.loading = false;
    }
  }

  /**
   * Mở modal xem chi tiết đơn hàng
   */
  openOrderDetailModal(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetailModal = true;
  }

  /**
   * Đóng modal xem chi tiết đơn hàng
   */
  closeOrderDetailModal(): void {
    this.showOrderDetailModal = false;
    this.selectedOrder = null;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Đang xử lý': 'bg-secondary text-white',
      'Đã xác nhận': 'bg-warning text-white',
      'Đang giao hàng': 'bg-info text-white',
      'Đã giao hàng': 'bg-success text-white',
      'Đã hủy': 'bg-danger text-white',
    };
    return statusMap[status] || 'status-processing';
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatPrice(price: number | undefined | null): string {
    if (price === undefined || price === null) {
      return '0đ';
    }
    return price.toLocaleString('vi-VN') + 'đ';
  }

  showOrderDetail(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetailModal = true;
  }

  closeOrderDetail(): void {
    this.showOrderDetailModal = false;
    this.selectedOrder = null;
  }

  calculateOrderTotal(order: Order): number {
    if (!order.itemOrder || !Array.isArray(order.itemOrder)) {
      return order.totalPrice || 0;
    }
    const subtotal = order.itemOrder.reduce(
      (sum: number, item) => sum + item.totalPrice,
      0
    );
    const shippingFee = order.shippingFee || 0;
    return subtotal + shippingFee;
  }

  // Phương thức điều hướng đến trang liên hệ
  navigateToContact() {
    this.router.navigate(['/lien-he']);
  }

  // Phương thức xử lý mua lại đơn hàng
  reorderItems(order?: Order): void {
    // Sử dụng order (tham số) nếu được truyền vào, nếu không thì dùng selectedOrder
    const orderToUse = order || this.selectedOrder;

    if (!orderToUse || !orderToUse.itemOrder) {
      this.showToast('error', 'Lỗi', 'Không thể tải thông tin đơn hàng');
      return;
    }

    let successCount = 0;
    const totalItems = orderToUse.itemOrder.length;

    // Thêm từng sản phẩm vào giỏ hàng
    orderToUse.itemOrder.forEach((item) => {
      const product: Product = {
        _id: item.productId,
        ingredientName: item.name,
        mainImage: item.img,
        subImage: '',
        level: '',
        time: '',
        combo: '',
        discount: 0,
        pricePerPortion: {
          [item.servingSize]: item.totalPrice / item.quantity,
        },
        description: '',
        notes: '',
        components: [],
        storage: '',
        expirationDate: '',
        tags: [],
        relatedProductIds: [],
        suggestedRecipeIds: [],
        region: '',
        category: '',
        quantity: 0,
        status: '',
      };

      this.cartService
        .addToCart(
          product,
          item.quantity,
          item.servingSize,
          item.totalPrice / item.quantity
        )
        .subscribe({
          next: () => {
            successCount++;
            if (successCount === totalItems) {
              this.showToast(
                'success',
                'Thành công',
                'Đã thêm tất cả sản phẩm vào giỏ hàng'
              );
            }
          },
          error: (error) => {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            this.showToast(
              'error',
              'Lỗi',
              'Không thể thêm một số sản phẩm vào giỏ hàng'
            );
          },
        });
    });
  }
}
