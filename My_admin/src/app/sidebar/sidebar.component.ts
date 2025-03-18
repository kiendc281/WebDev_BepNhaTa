import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  // Submenu state
  openSubmenu: string | null = null;

  // Toggle submenu function
  toggleSubmenu(menuName: string): void {
    if (this.openSubmenu === menuName) {
      this.openSubmenu = null;
    } else {
      this.openSubmenu = menuName;
    }
  }
}
