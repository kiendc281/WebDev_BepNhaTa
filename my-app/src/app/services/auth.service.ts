import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, BehaviorSubject, of, delay, from, switchMap } from 'rxjs';
import { Account, LoginResponse } from '../models/account.interface';
// Import Firebase auth
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenExpirationTime = 60 * 60 * 1000; // 1 giờ tính bằng mili giây
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginState());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // Firebase Config từ environment
  private firebaseConfig = environment.firebase;
  
  // Khởi tạo Firebase
  private app = initializeApp(this.firebaseConfig);
  private auth = getAuth(this.app);

  // Temporary storage for OTPs until backend implementation
  // Made public for development purposes only
  public tempOtpStorage = new Map<string, { otp: string, userData: any, timestamp: number }>();

  constructor(private http: HttpClient) { }

  private checkInitialLoginState(): boolean {
    const token = localStorage.getItem('token');
    const expirationTime = localStorage.getItem('tokenExpiration');

    if (!token || !expirationTime) {
      return false;
    }

    const currentTime = new Date().getTime();
    const expiration = parseInt(expirationTime, 10);

    return currentTime <= expiration;
  }

  login(account: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { account, password })
      .pipe(
        tap((response) => {
          if (response && response.token) {
            // Lưu token và thông tin user
            this.saveToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.account));

            // Cập nhật trạng thái đăng nhập
            this.isLoggedInSubject.next(true);

            // Thêm class cho icon đăng nhập
            const loginIcon = document.querySelector('.login-icon');
            if (loginIcon) {
              loginIcon.classList.remove('fa-user-group');
              loginIcon.classList.add('fa-user');
              loginIcon.classList.add('logged-in');
            }
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

  // Method to generate a random 6-digit OTP code
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Request OTP from server for registration
  requestOTP(email: string, name: string = ''): Observable<{ message: string }> {
    // Gọi API endpoint thực tế để yêu cầu OTP
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/request-otp`, { email, name })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error requesting OTP:', error);
          
          // Nếu server trả về lỗi 0 (không kết nối được) hoặc lỗi 404 (endpoint không tồn tại),
          // sử dụng phương pháp giả lập như fallback cho mục đích phát triển
          if (error.status === 0 || error.status === 404) {
            console.warn('Falling back to client-side OTP generation for development');
            return this.fallbackRequestOTP(email);
          }
          
          return throwError(() => error);
        })
      );
  }
  
  // Phương thức fallback để tạo OTP ở client (chỉ dùng khi API chưa hoạt động)
  private fallbackRequestOTP(email: string): Observable<{ message: string }> {
    // Generate a random OTP code
    const otp = this.generateOTP();
    
    // Log for development purposes
    console.log(`[Dev Only] Generated OTP for ${email}: ${otp}`);
    console.log('%c OTP CODE: ' + otp + ' ', 'background: #34495e; color: #fff; font-size: 16px; font-weight: bold; padding: 5px 10px; border-radius: 5px;');
    
    // Store the OTP temporarily
    this.tempOtpStorage.set(email, {
      otp,
      userData: null,
      timestamp: Date.now() + 10 * 60 * 1000 // 10 minutes from now
    });

    return of({ message: 'OTP sent successfully (client-side fallback)' }).pipe(delay(1000));
  }

  // Get the current OTP for an email (for development purposes)
  getCurrentOTP(email: string): string | null {
    const otpData = this.tempOtpStorage.get(email);
    return otpData ? otpData.otp : null;
  }

  // Verify OTP and complete registration
  verifyOTP(email: string, otp: string, userData: Account): Observable<LoginResponse> {
    // Gửi thông tin người dùng và OTP để xác thực 
    const requestData = {
      email,
      otp,
      name: userData.name,
      phone: userData.phone,
      password: userData.password,
      gender: userData.gender,
      birthOfDate: userData.birthOfDate
    };
    
    console.log('Sending verification data:', {...requestData, password: '[PROTECTED]'});
    
    // Gọi API endpoint thực tế để xác thực OTP
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/verify-otp`, requestData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error verifying OTP with server:', error);
          
          // Nếu server trả về lỗi 0 (không kết nối được) hoặc lỗi 404 (endpoint không tồn tại),
          // sử dụng phương pháp giả lập như fallback cho mục đích phát triển
          if (error.status === 0 || error.status === 404) {
            console.warn('Falling back to client-side OTP verification for development');
            return this.fallbackVerifyOTP(email, otp, userData);
          }
          
          return throwError(() => error);
        })
      );
  }
  
  // Phương thức fallback để xác thực OTP ở client (chỉ dùng khi API chưa hoạt động)
  private fallbackVerifyOTP(email: string, otp: string, userData: Account): Observable<LoginResponse> {
    // Check if OTP exists and is valid
    const otpData = this.tempOtpStorage.get(email);
    
    if (!otpData) {
      return throwError(() => {
        const error = new HttpErrorResponse({
          error: { message: 'No OTP was requested for this email' },
          status: 400,
          statusText: 'Bad Request'
        });
        return error;
      });
    }
    
    // Check if OTP has expired
    if (Date.now() > otpData.timestamp) {
      return throwError(() => {
        const error = new HttpErrorResponse({
          error: { message: 'OTP has expired' },
          status: 401,
          statusText: 'Unauthorized'
        });
        return error;
      });
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      return throwError(() => {
        const error = new HttpErrorResponse({
          error: { message: 'Invalid OTP' },
          status: 400,
          statusText: 'Bad Request'
        });
        return error;
      });
    }

    // OTP is valid, proceed with registration
    console.log(`[Dev Only] OTP verified successfully for ${email}`);
    
    // Clear the OTP from storage
    this.tempOtpStorage.delete(email);
    
    // Call the actual registration API
    return this.register(userData);
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
    console.log('AuthService: Updating password for user ID:', id);
    console.log('AuthService: Request payload:', {
      oldPassword: '********', // For security, don't log actual password
      newPassword: '********',
    });

    return this.http
      .patch(`${this.apiUrl}/accounts/${id}/password`, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      })
      .pipe(
        tap((response) => {
          console.log('AuthService: Password update successful:', response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('AuthService: Password update error:', error);
          if (error.status === 0) {
            return throwError(() => new Error('Không thể kết nối đến server'));
          } else if (error.status === 400) {
            // Pass through the server's error message
            return throwError(
              () => new Error(error.error?.message || 'Mật khẩu cũ không đúng')
            );
          }
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('user');
    this.isLoggedInSubject.next(false);
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

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // Phương thức đăng nhập bằng Google
  loginWithGoogle(): Observable<LoginResponse> {
    const provider = new GoogleAuthProvider();
    
    // Trả về Observable từ quá trình đăng nhập bằng Google
    return from(signInWithPopup(this.auth, provider))
      .pipe(
        switchMap((result: UserCredential) => {
          const user = result.user;
          const googleUser = {
            email: user.email,
            name: user.displayName,
            phone: user.phoneNumber || '',
            avatar: user.photoURL,
            googleId: user.uid
          };
          
          console.log('Google login successful:', googleUser);
          
          // Gửi thông tin đăng nhập Google đến backend để xác thực hoặc tạo tài khoản mới
          return this.http.post<LoginResponse>(
            `${this.apiUrl}/auth/google-login`, 
            googleUser
          ).pipe(
            tap((response) => {
              if (response && response.token) {
                // Lưu token và thông tin user
                this.saveToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.account));
                
                // Cập nhật trạng thái đăng nhập
                this.isLoggedInSubject.next(true);
                
                // Thêm class cho icon đăng nhập
                const loginIcon = document.querySelector('.login-icon');
                if (loginIcon) {
                  loginIcon.classList.remove('fa-user-group');
                  loginIcon.classList.add('fa-user');
                  loginIcon.classList.add('logged-in');
                }
              }
            }),
            catchError((error: HttpErrorResponse) => {
              console.error('Error during Google login integration with backend:', error);
              
              // Fallback if backend is not available (development only)
              if (error.status === 0 || error.status === 404) {
                console.warn('Using fallback for Google login (development only)');
                
                // Tạo token giả cho phát triển
                const fakeToken = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const fakeResponse: LoginResponse = {
                  token: fakeToken,
                  account: {
                    id: user.uid,
                    email: user.email || '',
                    name: user.displayName || '',
                    phone: user.phoneNumber || '',
                    gender: '',
                    birthOfDate: new Date(),
                    password: ''
                  }
                };
                
                // Lưu token và thông tin user
                this.saveToken(fakeResponse.token);
                localStorage.setItem('user', JSON.stringify(fakeResponse.account));
                
                // Cập nhật trạng thái đăng nhập
                this.isLoggedInSubject.next(true);
                
                return of(fakeResponse);
              }
              
              return throwError(() => error);
            })
          );
        }),
        catchError((error) => {
          console.error('Google sign-in error:', error);
          return throwError(() => new Error('Đăng nhập bằng Google thất bại: ' + error.message));
        })
      );
  }
}
