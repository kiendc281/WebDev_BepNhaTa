import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-chinh-sach',
  imports: [CommonModule],
  templateUrl: './chinh-sach.component.html',
  styleUrl: './chinh-sach.component.css',
})
export class ChinhSachComponent {
  selectedCategory: string = 'doi-tra';

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
