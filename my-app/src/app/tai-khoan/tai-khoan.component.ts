import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tai-khoan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tai-khoan.component.html',
  styleUrls: ['./tai-khoan.component.css'],
})
export class TaiKhoanComponent {
  selectedCategory: string = 'thong-tin';
  
  constructor(private authService: AuthService, private router: Router) {}

  showContent(contentId: string): void {
    this.selectedCategory = contentId;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  visibleAnswers: { [key: string]: boolean } = {};

  toggleAnswer(questionId: string): void {
    this.visibleAnswers[questionId] = !this.visibleAnswers[questionId];
  }

  isAnswerVisible(questionId: string): boolean {
    return this.visibleAnswers[questionId] || false;
  }
}
