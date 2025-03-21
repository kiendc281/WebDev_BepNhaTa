import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Order, OrderFilter, OrderStatus } from '../models/order.interface';

interface ApiResponse {
  status?: string;
  message?: string;
  data?: Order[] | Order;
  orders?: Order[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Lấy tất cả đơn hàng
  getOrders(): Observable<Order[]> {
    return this.http.get<any>(`${this.apiUrl}/all-orders`).pipe(
      map((response) => {
        console.log('Raw API response:', response);

        // Kiểm tra xem response có phải là mảng không
        if (Array.isArray(response)) {
          return response;
        }

        // Nếu là object với data hoặc orders property
        if (response && typeof response === 'object') {
          if (response.data && Array.isArray(response.data)) {
            return response.data;
          }
          if (response.orders && Array.isArray(response.orders)) {
            return response.orders;
          }
        }

        // Nếu không có dữ liệu hợp lệ, trả về mảng rỗng
        console.warn('API did not return expected data structure:', response);
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching orders:', error);
        // Trả về mảng rỗng thay vì ném lỗi để tránh crash ứng dụng
        return of([]);
      })
    );
  }

  // Lọc đơn hàng theo các tiêu chí
  filterOrders(filter: OrderFilter): Observable<Order[]> {
    return this.getOrders().pipe(
      map((orders) => {
        if (!Array.isArray(orders)) {
          console.warn('Expected array but got:', orders);
          return [];
        }

        let filteredOrders = orders;

        // Lọc theo trạng thái
        if (filter.status) {
          filteredOrders = filteredOrders.filter(
            (order) => order.status === filter.status
          );
        }

        // Lọc theo giá trị
        if (filter.minPrice !== undefined) {
          filteredOrders = filteredOrders.filter(
            (order) => order.totalPrice >= filter.minPrice!
          );
        }

        if (filter.maxPrice !== undefined) {
          filteredOrders = filteredOrders.filter(
            (order) => order.totalPrice <= filter.maxPrice!
          );
        }

        return filteredOrders;
      }),
      catchError((error) => {
        console.error('Error filtering orders:', error);
        // Trả về mảng rỗng thay vì ném lỗi
        return of([]);
      })
    );
  }

  // Lấy chi tiết đơn hàng theo ID
  getOrderById(id: string): Observable<Order> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`).pipe(
      map((response) => {
        console.log('Raw order detail response:', response);

        // Kiểm tra nếu response là object có data property
        if (
          response &&
          typeof response === 'object' &&
          !Array.isArray(response)
        ) {
          if (
            'data' in response &&
            response.data &&
            !Array.isArray(response.data)
          ) {
            return response.data as Order;
          }
        }

        // Nếu response đã là Order object
        if (response && typeof response === 'object' && '_id' in response) {
          return response as Order;
        }

        console.warn('Unexpected order detail format:', response);
        // Trả về object rỗng với _id để tránh lỗi
        return { _id: id } as unknown as Order;
      }),
      catchError((error) => {
        console.error('Error fetching order details:', error);
        // Trả về object rỗng để tránh crash ứng dụng
        return of({ _id: id } as unknown as Order);
      })
    );
  }

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus(id: string, status: OrderStatus): Observable<boolean> {
    console.log(`Updating order ${id} status to: ${status}`);
    console.log('Request URL:', `${this.apiUrl}/orders/${id}/status`);
    console.log('Request body:', { status });

    // Sử dụng PUT method theo đúng API backend
    return this.http
      .put<any>(`${this.apiUrl}/orders/${id}/status`, { status })
      .pipe(
        map((response) => {
          console.log('Update response:', response);
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response));
          return response?.status === 'success';
        }),
        catchError((error) => {
          console.error('Error updating order status:', error);
          console.error('Error details:', error.message);
          console.error('Status code:', error.status);
          console.error('Status text:', error.statusText);
          return of(false);
        })
      );
  }

  // Xóa đơn hàng
  deleteOrder(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/orders/${id}`).pipe(
      map((response) => {
        console.log('Delete response:', response);
        return true;
      }),
      catchError((error) => {
        console.error('Error deleting order:', error);
        return of(false); // Trả về false nếu có lỗi
      })
    );
  }

  // Lấy đơn hàng theo khách hàng
  getCustomerOrders(customerId: string): Observable<Order[]> {
    // Thay vì gọi API riêng, lấy tất cả đơn hàng và lọc trên client
    return this.getOrders().pipe(
      map((orders) => {
        console.log('Got all orders:', orders.length);
        console.log('Filtering all orders for customer ID:', customerId);

        // Log một số đơn hàng đầu tiên để kiểm tra cấu trúc
        if (orders.length > 0) {
          console.log('First few orders structure examples:');
          orders.slice(0, 3).forEach((order, index) => {
            console.log(`Order ${index + 1}:`, {
              id: order._id,
              customerId: order.customerId,
              accountId: (order as any).accountId, // Kiểm tra trường accountId
              guestInfo: order.guestInfo,
              status: order.status,
            });
          });
        }

        return orders.filter((order) => {
          // Kiểm tra các trường có thể chứa customerId
          if (order.customerId === customerId) {
            console.log('Matched by customerId');
            return true;
          }

          // Kiểm tra accountId nếu có
          if ((order as any).accountId === customerId) {
            console.log('Matched by accountId');
            return true;
          }

          // Kiểm tra trong trường guestInfo
          if (order.guestInfo) {
            if (order.guestInfo.email === customerId) {
              console.log('Matched by guestInfo.email');
              return true;
            }

            // Nếu ID khách hàng là số điện thoại
            if (order.guestInfo.phone === customerId) {
              console.log('Matched by guestInfo.phone');
              return true;
            }
          }

          return false;
        });
      }),
      catchError((error) => {
        console.error('Error fetching customer orders:', error);
        return of([]);
      })
    );
  }
}
