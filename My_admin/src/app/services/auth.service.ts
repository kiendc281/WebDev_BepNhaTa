import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Account, LoginResponse } from '../models/account.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api';
    private tokenExpirationTime = 60 * 60 * 1000; // 1 giờ tính bằng mili giây

    constructor(private http: HttpClient) { }

    login(account: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { account, password }).pipe(
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
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_tokenExpiration', expirationTime.toString());
    }

    logout(): void {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_tokenExpiration');
        localStorage.removeItem('admin_user');
    }

    isLoggedIn(): boolean {
        const token = localStorage.getItem('admin_token');
        const expirationTime = localStorage.getItem('admin_tokenExpiration');
        
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
        return localStorage.getItem('admin_token');
    }

    getCurrentUser(): Account | null {  
        const user = localStorage.getItem('admin_user');
        return user ? JSON.parse(user) : null;
    }
}
