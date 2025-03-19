import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb" class="breadcrumb-nav">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a routerLink="/trang-chu">Trang chủ</a>
        </li>
        <li class="breadcrumb-item" *ngIf="category">
          <a [routerLink]="categoryLink">{{ category }}</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ currentPage }}
        </li>
      </ol>
    </nav>
  `,
  styles: [
    `
      .breadcrumb-nav {
        padding: 15px 0;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        margin-bottom: 20px;
      }

      .breadcrumb {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #6c757d;
      }

      .breadcrumb-item a {
        color: #ea5c2b;
        text-decoration: none;
        transition: color 0.2s;
      }

      .breadcrumb-item a:hover {
        color: #d44a1f;
        text-decoration: underline;
      }

      .breadcrumb-item.active {
        color: #343a40;
      }

      @media (max-width: 768px) {
        .breadcrumb {
          padding: 0 15px;
        }

        .breadcrumb-item {
          font-size: 13px;
        }
      }
    `,
  ],
})
export class BreadcrumbComponent {
  @Input() category: string = '';
  @Input() categoryLink: string = '';
  @Input() currentPage: string = '';
}
