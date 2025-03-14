import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-lien-he',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lien-he.component.html',
  styleUrls: ['./lien-he.component.css']
})
export class LienHeComponent implements OnInit {
  feedbackForm!: FormGroup;
  submitted = false;
  success = false;
  error = false;
  loading = false;

  constructor(private fb: FormBuilder) {
    // Khởi tạo EmailJS với Public Key theo đúng cú pháp mới
    emailjs.init({
      publicKey: "y_SLL-hB216mj0QaB"
    });
  }

  ngOnInit(): void {
    // Khởi tạo form
    this.feedbackForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      message: ['', Validators.required]
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

    // Thông tin dịch vụ và template EmailJS
    const serviceID = 'Service_BepNhaTa';
    const templateID = 'template_contactus';

    // Chuẩn bị tham số để gửi email
    const templateParams = {
      from_name: this.feedbackForm.value.name,
      from_email: this.feedbackForm.value.email,
      from_phone: this.feedbackForm.value.phone,
      message: this.feedbackForm.value.message
    };

    // Gửi email sử dụng EmailJS - không cần truyền publicKey vì đã init từ trước
    emailjs.send(serviceID, templateID, templateParams)
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        this.success = true;
        this.loading = false;
        this.feedbackForm.reset();
        this.submitted = false;
      }, (error) => {
        console.log('FAILED...', error);
        this.error = true;
        this.loading = false;
      });
  }

  resetForm(): void {
    this.submitted = false;
    this.success = false;
    this.error = false;
    this.feedbackForm.reset();
  }
}
