export interface CartItem {
    productId: string;
    ingredientName: string;
    mainImage: string;
    quantity: number;
    servingSize: string;
    price: number;
  }
  
  export interface Cart {
    items: CartItem[];
    totalQuantity: number;
    totalPrice: number;
  } 