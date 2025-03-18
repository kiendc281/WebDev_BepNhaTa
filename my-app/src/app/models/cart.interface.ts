export interface CartItem {
    productId: string;
    productName?: string;
    ingredientName?: string;
    mainImage?: string;
    quantity: number;
    servingSize: string;
    price: number;
    selected?: boolean;
  }
  
  export interface Cart {
    items: CartItem[];
    totalQuantity: number;
    totalPrice: number;
  } 