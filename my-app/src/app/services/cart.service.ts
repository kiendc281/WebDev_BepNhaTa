import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.interface';

export interface CartItem {
  product: Product;
  quantity: number;
  serving: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'cart_items';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  constructor() {
    this.loadCart();
  }

  // Load cart from localStorage
  private loadCart(): void {
    const storedCart = localStorage.getItem(this.cartKey);
    if (storedCart) {
      try {
        this.cartItems = JSON.parse(storedCart);
        this.cartSubject.next(this.cartItems);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        this.cartItems = [];
        this.cartSubject.next(this.cartItems);
      }
    }
  }

  // Save cart to localStorage
  private saveCart(): void {
    localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
    this.cartSubject.next(this.cartItems);
  }

  // Get cart items as observable
  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  // Add item to cart
  addToCart(product: Product, quantity: number, serving: string, price: number): void {
    // Check if the product is already in the cart
    const existingItemIndex = this.cartItems.findIndex(
      item => item.product._id === product._id && item.serving === serving
    );

    if (existingItemIndex !== -1) {
      // Update quantity if the product is already in the cart
      this.cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      this.cartItems.push({
        product,
        quantity,
        serving,
        price
      });
    }

    this.saveCart();
  }

  // Update cart item quantity
  updateQuantity(productId: string, serving: string, quantity: number): void {
    const itemIndex = this.cartItems.findIndex(
      item => item.product._id === productId && item.serving === serving
    );

    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        this.removeFromCart(productId, serving);
      } else {
        // Update quantity
        this.cartItems[itemIndex].quantity = quantity;
        this.saveCart();
      }
    }
  }

  // Remove item from cart
  removeFromCart(productId: string, serving: string): void {
    const existingCart = this.getCartItemsFromLocalStorage();
    const filteredCart = existingCart.filter(item => 
      !(item.product._id === productId && item.serving === serving)
    );
    localStorage.setItem(this.cartKey, JSON.stringify(filteredCart));
    this.cartSubject.next(filteredCart);
  }

  removeSelectedItems(selectedItems: {productId: string, serving: string}[]): void {
    const existingCart = this.getCartItemsFromLocalStorage();
    const filteredCart = existingCart.filter(item => 
      !selectedItems.some(selected => 
        selected.productId === item.product._id && selected.serving === item.serving
      )
    );
    localStorage.setItem(this.cartKey, JSON.stringify(filteredCart));
    this.cartSubject.next(filteredCart);
  }

  // Clear cart
  clearCart(): void {
    this.cartItems = [];
    this.saveCart();
  }

  // Get cart total
  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get cart item count
  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  private getCartItemsFromLocalStorage(): CartItem[] {
    const storedCart = localStorage.getItem(this.cartKey);
    if (storedCart) {
      try {
        return JSON.parse(storedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        return [];
      }
    }
    return [];
  }
}
