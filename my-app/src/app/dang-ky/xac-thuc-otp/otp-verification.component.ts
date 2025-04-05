import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit {
  @Input() email: string = '';
  @Input() userData: any = null;
  @Output() closePopup = new EventEmitter<void>();
  @Output() verificationSuccess = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  otpForm: FormGroup;
  submitted = false;
  loading = false;
  otpError: string = '';
  otpControls = [0, 1, 2, 3, 4, 5]; // 6-digit OTP
  canResend = false;
  remainingTime = 60; // 60 seconds countdown
  timerInterval: any;
  notification: Notification = {
    show: false,
    message: '',
    type: 'success'
  };
  
  // For internal use only - not displayed in UI
  private devOtpCode: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const formControls: any = {};
    this.otpControls.forEach(i => {
      formControls[`digit${i + 1}`] = ['', [Validators.required, Validators.pattern(/^[0-9]$/)]];
    });
    this.otpForm = this.fb.group(formControls);
  }

  ngOnInit(): void {
    // Start the countdown timer
    this.startCountdown();
    
    // Get OTP code but don't display it
    this.getOtpFromService();
    
    // Monitor for future OTP codes
    this.setupConsoleMonitor();
  }

  // Private method to get OTP from service (for internal verification)
  private getOtpFromService(): void {
    if (this.email) {
      const otp = this.authService.getCurrentOTP(this.email);
      if (otp) {
        this.devOtpCode = otp;
      }
    }
  }

  // Private monitor for console messages (for development purposes)
  private setupConsoleMonitor(): void {
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      // Check if this is an OTP generation message
      if (args.length >= 2 && 
          typeof args[0] === 'string' && 
          args[0].includes('[Dev Only] Generated OTP') &&
          args[0].includes(this.email)) {
        // Extract OTP from log but don't display
        this.devOtpCode = args[1];
      }
      
      // Call original console.log
      originalConsoleLog.apply(console, args);
    };
  }

  // For testing purposes - in real implementation this would be removed
  private autoFillOtp(forced: boolean = false): void {
    if (!this.devOtpCode) {
      this.getOtpFromService();
    }
    
    if (this.devOtpCode) {
      const digits = this.devOtpCode.toString().split('');
      
      this.otpControls.forEach((_, i) => {
        if (digits[i]) {
          this.otpForm.get(`digit${i + 1}`)?.setValue(digits[i]);
        }
      });
    }
  }

  // Method to show notifications
  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = {
      show: true,
      message,
      type,
    };

    // Automatically hide notification after 3 seconds
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  // Handle input in OTP field
  onOtpDigitInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // If input is a digit, move to the next input
    if (/^[0-9]$/.test(value) && index < this.otpControls.length - 1) {
      const nextInput = input.parentElement.nextElementSibling?.querySelector('input');
      if (nextInput) {
        nextInput.focus();
      }
    }

    // If backspace is pressed and the field is empty, move to the previous input
    if (event.key === 'Backspace' && !value && index > 0) {
      const prevInput = input.parentElement.previousElementSibling?.querySelector('input');
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  // Handle paste event (for pasting the entire OTP)
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedData = clipboardData.getData('text');
    if (!pastedData) return;

    // Only process if pasted content looks like a numeric code
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split('').slice(0, this.otpControls.length);
      
      this.otpControls.forEach((_, i) => {
        if (digits[i]) {
          this.otpForm.get(`digit${i + 1}`)?.setValue(digits[i]);
        }
      });
    }
  }

  // Start countdown timer for OTP resend
  startCountdown() {
    this.canResend = false;
    this.remainingTime = 60;
    
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      if (this.remainingTime <= 0) {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }

  // Resend OTP
  resendOTP() {
    if (!this.canResend) return;
    
    this.loading = true;
    // Lấy tên người dùng từ userData nếu có
    const name = this.userData?.name || '';
    
    // Call API to resend OTP with name
    this.authService.requestOTP(this.email, name).subscribe({
      next: (response) => {
        this.loading = false;
        this.showNotification('Mã OTP đã được gửi lại thành công!', 'success');
        this.startCountdown(); // Restart the countdown
        
        // Update internal OTP code
        this.getOtpFromService();
      },
      error: (error) => {
        this.loading = false;
        this.showNotification('Không thể gửi lại mã OTP. Vui lòng thử lại sau.', 'error');
      }
    });
  }

  // Verify OTP
  verifyOTP() {
    this.submitted = true;
    this.otpError = '';

    if (this.otpForm.invalid) {
      this.otpError = 'Vui lòng nhập đầy đủ mã OTP';
      return;
    }

    const otp = this.otpControls.map(i => this.otpForm.get(`digit${i + 1}`)?.value).join('');
    
    this.loading = true;
    console.log('Dữ liệu người dùng trước khi gửi:', this.userData);
    
    // Call API to verify OTP and complete registration
    this.authService.verifyOTP(this.email, otp, this.userData).subscribe({
      next: (response) => {
        this.loading = false;
        this.showNotification('Xác thực thành công!', 'success');
        
        // Store user data if available
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.account));
        }
        
        // Wait 1.5 seconds then emit success and close
        setTimeout(() => {
          this.verificationSuccess.emit();
          this.switchToLogin.emit(); // Switch to login after successful verification
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi xác thực OTP:', error);
        
        if (error.status === 400) {
          // Try to get detailed error message from server
          this.otpError = error.error?.message || 'Mã OTP không đúng. Vui lòng kiểm tra lại.';
        } else if (error.status === 401) {
          this.otpError = error.error?.message || 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.';
        } else if (error.status === 500) {
          this.otpError = 'Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
          console.error('Chi tiết lỗi server:', error.error);
        } else {
          this.otpError = error.error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
        }
        
        this.showNotification(this.otpError, 'error');
      }
    });
  }

  onClose() {
    clearInterval(this.timerInterval);
    this.closePopup.emit();
  }
} 