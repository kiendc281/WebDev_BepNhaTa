import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trang-chu',
  templateUrl: './trang-chu.component.html',
  styleUrls: ['./trang-chu.component.css'],
})
export class TrangChuComponent {
  constructor(private router: Router) {}

  navigateToProducts() {
    this.router.navigate(['/san-pham']);
  }

  navigateToBlog() {
    this.router.navigate(['/blog']);
  }
}
