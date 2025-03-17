import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trang-chu',
  templateUrl: './trang-chu.component.html',
  styleUrls: ['./trang-chu.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class TrangChuComponent implements OnInit, OnDestroy {
  bannerImages = [
    'assets/trang-chu/banner1.png',
    'assets/trang-chu/banner2.png',
    'assets/trang-chu/banner3.jpg',
  ];
  currentBannerSlide = 0;
  private slideInterval: any;
  private readonly slideDelay = 5000; // 5 seconds
  private isAnimating = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.startSlideTimer();
  }

  ngOnDestroy() {
    this.stopSlideTimer();
  }

  startSlideTimer() {
    this.slideInterval = setInterval(() => {
      this.nextBannerSlide();
    }, this.slideDelay);
  }

  stopSlideTimer() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  nextBannerSlide() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();

    const nextSlide = (this.currentBannerSlide + 1) % this.bannerImages.length;
    this.currentBannerSlide = nextSlide;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  prevBannerSlide() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();

    const prevSlide =
      (this.currentBannerSlide - 1 + this.bannerImages.length) %
      this.bannerImages.length;
    this.currentBannerSlide = prevSlide;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  setCurrentBannerSlide(index: number) {
    if (index === this.currentBannerSlide || this.isAnimating) return;

    this.isAnimating = true;
    this.stopSlideTimer();
    this.currentBannerSlide = index;

    setTimeout(() => {
      this.isAnimating = false;
      this.startSlideTimer();
    }, 800); // Match transition duration
  }

  navigateToCategory(category: string) {
    this.router.navigate(['/san-pham'], {
      queryParams: { category: category },
    });
  }

  navigateToProducts() {
    this.router.navigate(['/san-pham']);
  }

  navigateToBlog() {
    this.router.navigate(['/blog']);
  }
}
