export interface CartItem {
<<<<<<< HEAD
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
=======
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
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
