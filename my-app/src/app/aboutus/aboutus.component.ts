import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-aboutus',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './aboutus.component.html',
  styleUrls: ['./aboutus.component.css'],
})
export class AboutusComponent {
  constructor(private router: Router) {}
  
  navigateToRecipes() {
    this.router.navigate(['/cong-thuc']);
  }
}
