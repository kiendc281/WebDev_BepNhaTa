import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NhapemailComponent } from './nhapemail/nhapemail.component';
import { NhapmaComponent } from './nhapma/nhapma.component';
import { DatlaiComponent } from './datlai/datlai.component';

@Component({
  selector: 'app-quen-mat-khau',
  standalone: true,
  imports: [CommonModule, NhapemailComponent, NhapmaComponent, DatlaiComponent],
  templateUrl: './quen-mat-khau.component.html',
  styleUrls: ['./quen-mat-khau.component.css']
})
export class QuenMatKhauComponent {
  @Output() closePopup = new EventEmitter<void>();
  @Output() backToLogin = new EventEmitter<void>();

  currentStep = 1; // 1: nhập email, 2: nhập mã, 3: đặt lại mật khẩu
  emailOrPhone: string = '';
  resetToken: string = '';

  onClose() {
    this.closePopup.emit();
  }

  onBack() {
    this.backToLogin.emit();
  }

  onEmailSubmitted(email: string) {
    this.emailOrPhone = email;
    this.currentStep = 2;
  }

  onOTPVerified(token: string) {
    this.resetToken = token;
    this.currentStep = 3;
  }

  onBackToEmail() {
    this.currentStep = 1;
  }

  onBackToOTP() {
    this.currentStep = 2;
  }
}
