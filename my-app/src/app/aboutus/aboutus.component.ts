import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-aboutus',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css'],
})
export class AboutusComponent {
  // Biến kiểm soát hiển thị nút scroll-to-top
  showScrollBtn: boolean = false;

  constructor(private router: Router) {}

  navigateToRecipes() {
    this.router.navigate(['/cong-thuc']);
  }

  // Theo dõi sự kiện cuộn trang
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    // Hiện button khi scroll xuống 300px
    this.showScrollBtn = window.scrollY > 300;
  }

  // Phương thức để cuộn lên đầu trang
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
