import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css'],
})
export class PopupComponent implements OnInit {
  isVisible = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Hiển thị popup sau 5 giây
    setTimeout(() => {
      this.isVisible = true;
    }, 5000);
  }

  closePopup() {
    this.isVisible = false;
  }

  navigateToRecipes() {
    this.closePopup();
    this.router.navigate(['/cong-thuc']);
  }

  navigateToProducts() {
    this.closePopup();
    this.router.navigate(['/san-pham']);
  }
}
