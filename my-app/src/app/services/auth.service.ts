import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
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
            }),
            tap(response => {
                this.saveToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.account));
                // We'll handle cart merging in the component using CartService.mergeCartsAfterLogin()
            })
        );
    }

    saveToken(token: string): void {
        const expirationTime = new Date().getTime() + this.tokenExpirationTime;
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiration', expirationTime.toString());
    }

    register(userData: Account): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
            tap(response => {
                this.saveToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.account));
                // We'll handle cart merging in the component using CartService.mergeCartsAfterLogin()
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        localStorage.removeItem('user');
        // Note: We don't clear the cart from localStorage when logging out
        // This allows guest users to keep their cart after logging out
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