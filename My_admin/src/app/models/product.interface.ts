export interface Product {
  _id: string;
  ingredientName: string;
  mainImage: string;
  subImage?: string;
  level: string;
  time: string;
  combo: string;
  discount: number;
  pricePerPortion: {
    [key: string]: number;
  };
  description: string;
  notes?: string;
  components: string[];
  storage: string;
  expirationDate: string;
  tags: string[];
  relatedProductIds: string[];
  suggestedRecipeIds: string[];
  region: string;
  category: string;
  quantity: number;
  status: string;
  rating?: {
    rate: number;
    count: number;
  };

  // Các trường bổ sung cho giao diện
  name?: string;
  code?: string;
  price?: string;
  numericPrice?: number;
  date?: string;
  timestamp?: number;
  [key: string]: any; // Index signature cho phép truy cập động
}
