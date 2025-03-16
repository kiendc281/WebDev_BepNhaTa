import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trang-chu',
  templateUrl: './trang-chu.component.html',
  styleUrls: ['./trang-chu.component.css'],
})
export class TrangChuComponent implements OnInit, OnDestroy {
  currentBannerSlide = 0;
  currentBannerImage = '../../assets/trang-chu/banner.png';
  private bannerImages = [
    '../../assets/trang-chu/banner.png',
    '../../assets/trang-chu/banner1.jpg',
    '../../assets/trang-chu/banner2.jpg'
  ];
  private slideInterval: any;
  private readonly slideDelay = 5000; // 5 seconds

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
    this.currentBannerSlide = (this.currentBannerSlide + 1) % 3;
    this.currentBannerImage = this.bannerImages[this.currentBannerSlide];
  }

  setCurrentBannerSlide(index: number) {
    this.stopSlideTimer();
    this.currentBannerSlide = index;
    this.currentBannerImage = this.bannerImages[this.currentBannerSlide];
    this.startSlideTimer();
  }

  navigateToProducts() {
    this.router.navigate(['/san-pham']);
  }

  navigateToBlog() {
    this.router.navigate(['/blog']);
  }
}
