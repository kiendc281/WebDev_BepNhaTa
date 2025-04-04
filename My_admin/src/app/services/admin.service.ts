import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Admin } from '../models/admin.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/accounts';

  constructor(private http: HttpClient) {}

  getAdmins(): Observable<Admin[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((accounts) => {
        console.log('Raw API data:', accounts); // Để debug
        return accounts
          .filter((account) => account.role === 'admin')
          .map((account) => {
            if (!account._id) {
              console.error('Account missing _id:', account);
              return null;
            }
            const admin: Admin = {
              _id: account._id,
              email: account.email,
              password: '', // Không trả về password
              name: account.name || account.fullName || 'Chưa cập nhật', // Thử lấy cả name và fullName
              phone: account.phone || 'Chưa cập nhật',
              birthOfDate: account.birthOfDate || account.dateOfBirth || '', // Thử lấy cả birthOfDate và dateOfBirth
              gender: account.gender || 'male',
              role: account.role || 'admin',
              createdAt: account.createdAt,
            };
            console.log('Mapped admin:', admin); // Để debug
            return admin;
          })
          .filter((admin): admin is Admin => admin !== null); // Loại bỏ các admin null
      }),
      catchError(this.handleError)
    );
  }

  getAdmin(id: string): Observable<Admin> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((account) => {
        console.log('Raw account data:', account); // Để debug
        if (!account._id) {
          throw new Error('Account missing _id');
        }

        // Format birthOfDate string for display in the date input
        let birthDate = account.birthOfDate || account.dateOfBirth || '';
        if (birthDate) {
          // Convert to YYYY-MM-DD format for date input
          try {
            const date = new Date(birthDate);
            if (!isNaN(date.getTime())) {
              birthDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error formatting birth date:', e);
          }
        }

        // Normalize gender value to ensure it's either 'male' or 'female'
        let normalizedGender: 'male' | 'female' = 'male'; // Default to male
        if (account.gender) {
          // Convert to lowercase for case insensitive comparison
          const genderLower = String(account.gender).toLowerCase();
          if (
            genderLower === 'female' ||
            genderLower === 'nữ' ||
            genderLower === 'nu'
          ) {
            normalizedGender = 'female';
          }
        }

        const admin: Admin = {
          _id: account._id,
          email: account.email,
          password: '', // Không trả về password
          name: account.name || account.fullName || 'Chưa cập nhật', // Thử lấy cả name và fullName
          phone: account.phone || 'Chưa cập nhật',
          birthOfDate: birthDate,
          gender: normalizedGender,
          role: account.role || 'admin',
          createdAt: account.createdAt,
        };
        console.log('Mapped admin:', admin); // Để debug
        console.log('Normalized gender:', normalizedGender); // Để debug giá trị gender
        return admin;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage =
          'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy tài nguyên yêu cầu.';
      } else if (error.status === 400) {
        errorMessage = error.error.message || 'Yêu cầu không hợp lệ.';
      } else if (error.status === 401) {
        errorMessage = 'Không có quyền truy cập.';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện hành động này.';
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  createAdmin(admin: Omit<Admin, '_id'>): Observable<Admin> {
    return this.http
      .post<Admin>(this.apiUrl, admin)
      .pipe(catchError(this.handleError));
  }

  updateAdmin(
    id: string,
    admin: Partial<Omit<Admin, '_id'>>
  ): Observable<Admin> {
    // Format the data according to API requirements
    const updateData: Record<string, any> = {
      email: admin.email,
      name: admin.name, // API expects name
      phone: admin.phone,
      birthOfDate: admin.birthOfDate, // API expects birthOfDate
      gender: admin.gender,
      role: 'admin',
    };

    // Format the birthOfDate to ISO string if it's not already
    if (
      updateData['birthOfDate'] &&
      typeof updateData['birthOfDate'] === 'string'
    ) {
      try {
        // If already in ISO format, this will work fine
        // If in YYYY-MM-DD format (from date input), it will convert properly
        const date = new Date(updateData['birthOfDate']);
        if (!isNaN(date.getTime())) {
          updateData['birthOfDate'] = date.toISOString();
        }
      } catch (e) {
        console.error('Error formatting birth date for update:', e);
      }
    }

    // Remove any undefined or null values
    Object.keys(updateData).forEach((key) => {
      if (
        updateData[key] === undefined ||
        updateData[key] === null ||
        updateData[key] === ''
      ) {
        delete updateData[key];
      }
    });

    console.log('Sending update request to:', `${this.apiUrl}/${id}`);
    console.log('Update data:', updateData);

    return this.http.patch<any>(`${this.apiUrl}/${id}`, updateData).pipe(
      map((response) => {
        console.log('Update response:', response);

        // Format birthOfDate for display
        let birthDate = response.birthOfDate || response.dateOfBirth || '';
        if (birthDate) {
          try {
            const date = new Date(birthDate);
            if (!isNaN(date.getTime())) {
              birthDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error formatting birth date in response:', e);
          }
        }

        // Map the response back to our Admin interface
        return {
          _id: response._id,
          email: response.email,
          password: '',
          name: response.name || 'Chưa cập nhật',
          phone: response.phone || 'Chưa cập nhật',
          birthOfDate: birthDate,
          gender: response.gender || 'male',
          role: response.role || 'admin',
          createdAt: response.createdAt,
        };
      }),
      catchError((error) => {
        console.error('Update error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
        });
        return this.handleError(error);
      })
    );
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }
}
