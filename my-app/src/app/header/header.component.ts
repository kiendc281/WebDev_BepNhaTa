import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, DangNhapComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  showLoginPopup = false;

  constructor(private router: Router) {}

  toggleLoginPopup() {
    this.showLoginPopup = !this.showLoginPopup;
  }

  closeLoginPopup(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.showLoginPopup = false;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/dang-nhap']);
  }
}
