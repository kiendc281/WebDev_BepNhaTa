import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-lien-he',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './lien-he.component.html',
  styleUrls: ['./lien-he.component.css'],
})
export class LienHeComponent implements OnInit {
  feedbackForm!: FormGroup;
  submitted = false;
  success = false;
  error = false;
  loading = false;
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    // Khởi tạo form
    this.feedbackForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      message: ['', Validators.required],
    });
  }

  // Getter để dễ dàng truy cập các trường form
  get f() {
    return this.feedbackForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.success = false;
    this.error = false;

    if (this.feedbackForm.invalid) {
      return;
    }

    this.loading = true;

    // Chuẩn bị dữ liệu để gửi đến API
    const contactData = {
      name: this.feedbackForm.value.name,
      email: this.feedbackForm.value.email,
      phone: this.feedbackForm.value.phone,
      message: this.feedbackForm.value.message,
    };

    // Gửi dữ liệu đến API backend
    this.http.post(`${this.apiUrl}/send-contact`, contactData).subscribe({
      next: (response: any) => {
        console.log('Gửi thắc mắc thành công:', response);
        this.success = true;
        this.loading = false;
        this.feedbackForm.reset();
        this.submitted = false;
      },
      error: (error) => {
        console.error('Lỗi khi gửi thắc mắc:', error);
        this.error = true;
        this.loading = false;
      },
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.success = false;
    this.error = false;
    this.feedbackForm.reset();
  }
}
