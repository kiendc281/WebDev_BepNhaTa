import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tai-khoan',
  imports: [CommonModule],
  templateUrl: './tai-khoan.component.html',
  styleUrl: './tai-khoan.component.css',
})
export class TaiKhoanComponent {
  selectedCategory: string = 'ban-hang';

  showContent(contentId: string): void {
    this.selectedCategory = contentId;
  }

  visibleAnswers: { [key: string]: boolean } = {};

  toggleAnswer(questionId: string): void {
    this.visibleAnswers[questionId] = !this.visibleAnswers[questionId];
  }

  isAnswerVisible(questionId: string): boolean {
    return this.visibleAnswers[questionId] || false;
  }
}
