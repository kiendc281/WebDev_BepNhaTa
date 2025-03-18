import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only add token to requests to our API
    if (request.url.includes('localhost:3000') || request.url.includes('/api/')) {
      const token = this.authService.getToken();
      
      if (token) {
        // Clone the request and add the token to the Authorization header
        const authRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(authRequest);
      }
    }
    
    // Pass the request through unchanged if no token or not our API
    return next.handle(request);
  }
} 