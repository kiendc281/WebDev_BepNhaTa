import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { Admin } from '../models/admin.interface';

@Component({
  selector: 'app-admin-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-detail.component.html',
  styleUrls: ['./admin-detail.component.css'],
})
export class AdminDetailComponent implements OnInit {
  admin: Admin | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAdminDetails(id);
    }
  }

  loadAdminDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    console.log('Loading admin details for ID:', id);
    this.adminService.getAdmin(id).subscribe({
      next: (data) => {
        console.log('Received admin data:', data);
        this.admin = data;
        console.log('Admin object after assignment:', this.admin);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admin details:', error);
        this.error = 'Không thể tải thông tin admin. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  onEdit(): void {
    if (this.admin) {
      this.router.navigate(['/admin/edit', this.admin._id]);
    }
  }

  onBack(): void {
    this.router.navigate(['/admin']);
  }
}
