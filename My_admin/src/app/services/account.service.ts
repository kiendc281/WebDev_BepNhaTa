import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Account } from '../models/account.interface';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private apiUrl = 'http://localhost:3000/api/accounts';

  constructor(private http: HttpClient) {}

  // Lấy tất cả account
  getAllAccounts(): Observable<Account[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((accounts) => {
        console.log('Raw API accounts data:', accounts);
        return accounts.map((account) => {
          // Chuyển đổi dữ liệu API sang Account interface
          return {
            _id: account._id,
            email: account.email,
            phone: account.phone || '',
            fullName: account.name || account.fullName || account.email, // Sử dụng name hoặc fullName tùy theo API
            role: account.role || 'user', // Mặc định là user nếu không có role
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          } as Account;
        });
      })
    );
  }

  // Lấy danh sách admin
  getAdminAccounts(): Observable<Account[]> {
    return this.getAllAccounts().pipe(
      map((accounts) => {
        // Hiển thị tất cả tài khoản để kiểm tra
        console.log('All accounts before filtering:', accounts);

        // Lọc chỉ lấy account có role là admin hoặc các role có quyền đăng blog
        // Nếu không có tài khoản admin, tạm thời hiển thị tất cả để kiểm tra
        const adminAccounts = accounts.filter(
          (account) =>
            account.role === 'admin' ||
            account.role === 'superadmin' ||
            account.role === 'content-creator' ||
            account.role === 'ADMIN' || // Thêm các cách viết hoa khác nhau
            account.role === 'Admin'
        );

        console.log('Admin accounts after filtering:', adminAccounts);

        // Nếu không tìm thấy admin nào, tạm trả về tất cả tài khoản để kiểm tra UI
        return adminAccounts.length > 0 ? adminAccounts : accounts;
      })
    );
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((account) => {
        console.log('Raw account data by ID:', account);
        return {
          _id: account._id,
          email: account.email,
          phone: account.phone || '',
          fullName: account.name || account.fullName || account.email,
          role: account.role || 'user',
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        } as Account;
      })
    );
  }
}
