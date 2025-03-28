import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dark-mode-toggle" (click)="toggleDarkMode()">
      <i *ngIf="isDarkMode" class="bi bi-sun-fill" style="color: #FFD700;"></i>
      <i *ngIf="!isDarkMode" class="bi bi-moon-fill" style="color: #6c757d;"></i>
    </div>
  `,
  styles: [`
    .dark-mode-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      background-color: transparent;
      transition: background-color 0.3s ease;
    }
    
    .dark-mode-toggle:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .dark-mode-toggle i {
      font-size: 22px;
    }
  `]
})
export class ThemeToggleComponent implements OnInit {
  isDarkMode: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.loadDarkModePreference();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    console.log('Chế độ tối:', this.isDarkMode ? 'Đã bật' : 'Đã tắt');
  }

  private loadDarkModePreference(): void {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = darkModeEnabled;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    console.log('Đã tải tùy chọn chế độ tối:', this.isDarkMode);
  }
} 