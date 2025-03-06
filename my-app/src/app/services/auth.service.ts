import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, LoginResponse } from '../models/account.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    login(account: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { account, password });
    }

    register(userData: Account): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, userData);
    }

    logout(): void {
        localStorage.clear();
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getCurrentUser(): Account | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
} 