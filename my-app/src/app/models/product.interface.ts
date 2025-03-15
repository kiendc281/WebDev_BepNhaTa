export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  level?: string; // Độ khó (dễ, trung bình, khó)
  time?: string; // Thời gian chế biến
  rating: {
    rate: number;
    count: number;
  };
}
