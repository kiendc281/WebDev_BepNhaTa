import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      (req, next) => {
        // This is an inline implementation of our AuthInterceptor
        // We do this to avoid issues with standalone components and providers
        const authService = (window as any).__authService__;
        
        // Only add token to requests to our API
        if (req.url.includes('localhost:3000') || req.url.includes('/api/')) {
          const token = authService?.getToken();
          
          if (token) {
            // Clone the request and add the token to the Authorization header
            return next(req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            }));
          }
        }
        
        // Pass the request through unchanged if no token or not our API
        return next(req);
      }
    ])),
    provideAnimations(),
    provideClientHydration()
  ],
};
