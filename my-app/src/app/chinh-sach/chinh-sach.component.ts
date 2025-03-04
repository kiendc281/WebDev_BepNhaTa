import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-chinh-sach',
  imports: [CommonModule, RouterModule],
  templateUrl: './chinh-sach.component.html',
  styleUrl: './chinh-sach.component.css',
})
export class ChinhSachComponent implements AfterViewInit, OnInit {
  // navigate
  selectedCategory: string = 'doi-tra';
  private readonly HEADER_HEIGHT = 180; // Chiều cao của header

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Scroll to top when component is initialized
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }

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

  ngAfterViewInit() {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.selectedCategory = fragment;
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - this.HEADER_HEIGHT;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
    });
  }
}
