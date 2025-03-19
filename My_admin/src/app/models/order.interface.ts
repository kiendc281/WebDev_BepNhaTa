export interface Order {
  _id: string;
  orderCode: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  items?: OrderItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus =
  | 'Đã hủy'
  | 'Hoàn thành'
  | 'Đang giao hàng'
  | 'Chờ lấy hàng'
  | 'Chờ xác nhận';

export interface OrderFilter {
  status?: OrderStatus;
  minPrice?: number;
  maxPrice?: number;
}
