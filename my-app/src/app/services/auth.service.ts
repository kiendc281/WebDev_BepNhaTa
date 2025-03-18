import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { Account, LoginResponse } from '../models/account.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenExpirationTime = 60 * 60 * 1000; // 1 giờ tính bằng mili giây

  constructor(private http: HttpClient) {}

  login(account: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { account, password })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0) {
            return throwError(() => new Error('Không thể kết nối đến server'));
          }
          return throwError(() => error);
        })
      );
  }

  saveToken(token: string): void {
    const expirationTime = new Date().getTime() + this.tokenExpirationTime;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
  }

  register(userData: Account): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/register`,
      userData
    );
  }

  // Method to update user account information
  updateAccount(id: string, updateData: Partial<Account>): Observable<any> {
    // Create a copy of the update data
    const dataToSend: any = { ...updateData };

    // Handle Date objects properly
    if (dataToSend.birthOfDate instanceof Date) {
      // Convert to ISO string for server
      dataToSend.birthOfDate = dataToSend.birthOfDate.toISOString();
    }

    console.log('Sending to server:', dataToSend);

    return this.http.patch(`${this.apiUrl}/accounts/${id}`, dataToSend).pipe(
      tap((response) => {
        // Update the local user data if the update was successful
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updateData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          return throwError(() => new Error('Không thể kết nối đến server'));
        }
        return throwError(() => error);
      })
    );
  }

  // Method to update password
  updatePassword(
    id: string,
    passwords: { oldPassword: string; newPassword: string }
  ): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/accounts/${id}`, {
        password: passwords.newPassword,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0) {
            return throwError(() => new Error('Không thể kết nối đến server'));
          }
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const expirationTime = localStorage.getItem('tokenExpiration');

    if (!token || !expirationTime) {
      return false;
    }

    const currentTime = new Date().getTime();
    const expiration = parseInt(expirationTime, 10);

    // Nếu token đã hết hạn, tự động đăng xuất
    if (currentTime > expiration) {
      this.logout();
      return false;
    }

    return true;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): Account | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
