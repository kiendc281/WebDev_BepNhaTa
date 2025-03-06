import {
  Component,
  EventEmitter,
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

@Component({
  selector: 'app-nhapma',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nhapma.component.html',
  styleUrls: ['./nhapma.component.css'],
})
export class NhapmaComponent implements OnInit, OnDestroy {
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToReset = new EventEmitter<void>();

  verifyForm: FormGroup;
  submitted = false;

  // Timer properties
  minutes: number = 0;
  seconds: number = 0;
  timerInterval: any;
  canResend: boolean = false;

  constructor(private fb: FormBuilder) {
    this.verifyForm = this.fb.group({
      verificationCode: ['', [Validators.required]],
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
    this.minutes = 0;
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

    if (this.verifyForm.valid) {
      console.log('Verification code submitted:', this.verifyForm.value);
      // Add verification logic here
    }
  }

  resendCode() {
    if (this.canResend) {
      // Add resend code logic here
      this.startTimer();
      console.log('Resending verification code...');
    }
  }

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToReset.emit();
  }
}
