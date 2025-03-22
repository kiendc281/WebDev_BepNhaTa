import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.interface';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = 'http://localhost:3000/api/accounts';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((accounts) => {
        console.log('Raw API data:', accounts);
        // Lọc các tài khoản không phải là admin và ánh xạ thành Customer
        return accounts
          .filter((account) => account.role !== 'admin')
          .map((account) => {
            // Ánh xạ từ dữ liệu API sang Customer interface
            return {
              _id: account._id,
              username: account.email, // Sử dụng email làm username vì API không có trường username
              fullName: account.name, // API trả về name thay vì fullName
              email: account.email,
              phone: account.phone || 'Chưa cập nhật',
              address: account.address || 'Chưa cập nhật',
              createdAt: account.createdAt,
              dateOfBirth: account.birthOfDate, // API trả về birthOfDate thay vì dateOfBirth
              gender: account.gender,
              role: account.role,
            } as Customer;
          });
      })
    );
  }

  getCustomer(id: string): Observable<Customer> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((account) => {
        console.log('Raw account data:', account);
        return {
          _id: account._id,
          username: account.email, // Sử dụng email làm username
          fullName: account.name, // API trả về name thay vì fullName
          email: account.email,
          phone: account.phone || 'Chưa cập nhật',
          address: account.address || 'Chưa cập nhật',
          createdAt: account.createdAt,
          dateOfBirth: account.birthOfDate, // API trả về birthOfDate thay vì dateOfBirth
          gender: account.gender,
          role: account.role,
        } as Customer;
      })
    );
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }

  updateCustomer(
    id: string,
    customer: Partial<Customer>
  ): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
