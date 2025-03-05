import { Component, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dang-nhap',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dang-nhap.component.html',
  styleUrl: './dang-nhap.component.css',
})
export class DangNhapComponent {
  @ViewChild('loginForm') loginForm!: NgForm;
  email: string = '';
  pass: string = '';
  submitted: boolean = false;
  showPassword: boolean = false;
  eyeIcon: string = '../../assets/sign in up/clarity-eye-hide-line.svg';

  constructor(private router: Router) {}

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.valid) {
      // Handle form submission
      console.log('Form submitted', this.email, this.pass);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.eyeIcon = this.showPassword
      ? '../../assets/sign in up/unhide.svg'
      : '../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  navigateToRegister() {
    this.router.navigate(['/dang-ky']);
  }
}
