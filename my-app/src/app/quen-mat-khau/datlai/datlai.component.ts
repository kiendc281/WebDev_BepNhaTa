import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-datlai',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datlai.component.html',
  styleUrls: ['./datlai.component.css'],
})
export class DatlaiComponent {
  @Output() closePopup = new EventEmitter<void>();

  resetForm: FormGroup;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;
  passwordIcon = '../../../assets/sign in up/clarity-eye-hide-line.svg';
  confirmPasswordIcon = '../../../assets/sign in up/clarity-eye-hide-line.svg';

  constructor(private fb: FormBuilder) {
    this.resetForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
  }

  // Custom validator for password match
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  // Getter for easy access to form fields
  get f() {
    return this.resetForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.resetForm.valid) {
      console.log('Password reset submitted:', this.resetForm.value);
      // Add password reset logic here
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.passwordIcon = this.showPassword
      ? '../../../assets/sign in up/unhide.svg'
      : '../../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.confirmPasswordIcon = this.showConfirmPassword
      ? '../../../assets/sign in up/unhide.svg'
      : '../../../assets/sign in up/clarity-eye-hide-line.svg';
  }

  onClose() {
    this.closePopup.emit();
  }
}
