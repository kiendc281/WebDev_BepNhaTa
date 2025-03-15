import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-nhapma',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  providers: [PasswordResetService],
  templateUrl: './nhapma.component.html',
  styleUrls: ['./nhapma.component.css'],
})
export class NhapmaComponent implements OnInit, OnDestroy {
  @Input() emailOrPhone: string = '';
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<string>();

  verifyForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  // Timer properties
  minutes: number = 0;
  seconds: number = 0;
  timerInterval: any;
  canResend: boolean = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService
  ) {
    this.verifyForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer() {
    this.minutes = 4;
    this.seconds = 59;
    this.canResend = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.seconds > 0) {
        this.seconds--;
      } else if (this.minutes > 0) {
        this.minutes--;
        this.seconds = 59;
      } else {
        clearInterval(this.timerInterval);
        this.canResend = true;
      }
    }, 1000);
  }

  // Getter for easy access to form fields
  get f() {
    return this.verifyForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.verifyForm.valid) {
      this.loading = true;
      const otp = this.verifyForm.value.otp;

      this.passwordResetService.verifyOTP(this.emailOrPhone, otp).subscribe({
        next: (response) => {
          console.log('OTP verified successfully:', response);
          this.loading = false;
          this.nextStep.emit(response.resetToken);
        },
        error: (error) => {
          console.error('Error verifying OTP:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Không thể xác thực mã OTP. Vui lòng thử lại.';
        }
      });
    }
  }

  resendCode() {
    if (this.canResend) {
      this.loading = true;
      this.errorMessage = '';
      
      this.passwordResetService.sendOTP(this.emailOrPhone).subscribe({
        next: (response) => {
          console.log('OTP resent successfully:', response);
          this.loading = false;
          this.startTimer();
        },
        error: (error) => {
          console.error('Error resending OTP:', error);
          this.loading = false;
          this.errorMessage = error.error?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
        }
      });
    }
  }

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToLogin.emit();
  }
}
