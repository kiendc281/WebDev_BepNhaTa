import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-chinh-sach',
  imports: [CommonModule, RouterModule],
  templateUrl: './chinh-sach.component.html',
  styleUrl: './chinh-sach.component.css',
})
export class ChinhSachComponent implements AfterViewInit {
  // navigate
  selectedCategory: string = 'doi-tra';

  showContent(contentId: string): void {
    this.selectedCategory = contentId;
  }

  // visibleAnswers: { [key: string]: boolean } = {};
  // // toggle list
  // toggleAnswer(questionId: string): void {
  //   this.visibleAnswers[questionId] = !this.visibleAnswers[questionId];
  // }

  // isAnswerVisible(questionId: string): boolean {
  //   return this.visibleAnswers[questionId] || false;
  // }
  // footer navigate
  constructor(private route: ActivatedRoute) {}

  ngAfterViewInit() {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        document
          .getElementById(fragment)
          ?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
