export interface Order {
  _id: string;
  customerId?: string;
  accountId?: string;
  guestInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  orderDate: string | Date;
  status: OrderStatus;
  items?: OrderItem[];
  itemOrder?: OrderItem[];
  products?: OrderItem[];
  totalPrice: number;
  paymentMethod?: string;
  shippingFee?: number;
  discount?: number;
  prePrice?: number;
  note?: string;
}

export interface OrderItem {
  _id?: string;
  name: string;
  img?: string;
  image?: string;
  quantity: number;
  price?: number;
  totalPrice: number;
  productId?: string;
}

export interface GuestInfo {
  _id?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export type OrderStatus =
  | 'Đang xử lý'
  | 'Đã xác nhận'
  | 'Đang giao hàng'
  | 'Đã giao hàng'
  | 'Đã hủy';

export interface OrderFilter {
  status?: OrderStatus;
  minPrice?: number;
  maxPrice?: number;
}
