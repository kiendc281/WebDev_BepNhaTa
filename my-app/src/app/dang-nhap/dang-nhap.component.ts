import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css',
})
export class DangNhapComponent {
  @ViewChild('loginForm') loginForm!: NgForm;
  email: string = '';
  pass: string = '';
  submitted: boolean = false;
  showPassword: boolean = false;

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.valid) {
      // Handle form submission
      console.log('Form submitted', this.email, this.pass);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById(
      'password'
    ) as HTMLInputElement;
    passwordInput.type = this.showPassword ? 'text' : 'password';
  }
}
