export interface Order {
  _id: string;
  accountId: string;
  orderDate: Date;
  itemOrder: OrderItem[];
  prePrice: number;
  discount: number;
  shippingFee: number;
  totalPrice: number;
  addressId?: string;
  guestInfo?: GuestInfo;
  shipDate?: Date;
  paymentMethod: 'COD' | 'BANK';
  status: 'Đang xử lý' | 'Đã xác nhận' | 'Đang giao hàng' | 'Đã giao' | 'Đã hủy';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  img: string;
  servingSize: string;
  quantity: number;
  totalPrice: number;
}

export interface GuestInfo {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  note?: string;
} 