import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { CartItem, Cart } from '../models/cart.interface';
import { Product } from '../models/product.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = 'http://localhost:3000/api/cart';
  private cartSubject = new BehaviorSubject<Cart>({ items: [], totalQuantity: 0, totalPrice: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadCart();
  }

  /**
   * Loads the cart based on authentication status
   * - For authenticated users: Fetches cart from server
   * - For non-authenticated users: Loads cart from local storage
   */
  loadCart(): void {
    if (this.authService.isLoggedIn()) {
      // User is logged in, load cart from server
      this.http.get<{ items: CartItem[] }>(`${this.apiUrl}`).subscribe({
        next: (response) => {
          if (response && response.items) {
            const cart = this.calculateCartTotals(response.items);
            this.cartSubject.next(cart);
          }
        },
        error: (error) => {
          console.error('Error loading cart from server:', error);
          // Fallback to local storage if server fails
          this.loadCartFromLocalStorage();
        }
      });
    } else {
      // User is not logged in, load cart from localStorage
      this.loadCartFromLocalStorage();
    }
  }

  /**
   * Loads cart data from local storage
   */
  private loadCartFromLocalStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart && Array.isArray(parsedCart.items)) {
          const cart = this.calculateCartTotals(parsedCart.items);
          this.cartSubject.next(cart);
        }
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        // Initialize empty cart if parsing fails
        this.initializeEmptyCart();
      }
    } else {
      // Initialize empty cart if no cart in localStorage
      this.initializeEmptyCart();
    }
  }

  /**
   * Initializes an empty cart
   */
  private initializeEmptyCart(): void {
    const emptyCart: Cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    this.cartSubject.next(emptyCart);
    localStorage.setItem('cart', JSON.stringify(emptyCart));
  }

  /**
   * Calculates cart totals (total quantity and price)
   */
  private calculateCartTotals(items: CartItem[]): Cart {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { items, totalQuantity, totalPrice };
  }

  /**
   * Adds a product to the cart
   */
  addToCart(product: Product, quantity: number, servingSize: string, price: number): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(
      item => item.productId === product._id && item.servingSize === servingSize
    );
    
    let updatedItems: CartItem[];
    
    if (existingItemIndex !== -1) {
      // Item already exists in cart, update quantity
      updatedItems = [...currentCart.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
    } else {
      // Item doesn't exist, add new item
      const newItem: CartItem = {
        productId: product._id,
        ingredientName: product.ingredientName,
        mainImage: product.mainImage,
        quantity: quantity,
        servingSize: servingSize,
        price: price
      };
      updatedItems = [...currentCart.items, newItem];
    }
    
    const updatedCart = this.calculateCartTotals(updatedItems);
    
    if (this.authService.isLoggedIn()) {
      // Save to server if logged in
      return this.saveCartToServer(updatedCart).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          // Also save to localStorage as backup
          localStorage.setItem('cart', JSON.stringify(cart));
        })
      );
    } else {
      // Save to localStorage if not logged in
      this.cartSubject.next(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return of(updatedCart);
    }
  }

  /**
   * Updates the quantity of an item in the cart
   */
  updateQuantity(productId: string, servingSize: string, quantity: number): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.items.findIndex(
      item => item.productId === productId && item.servingSize === servingSize
    );
    
    if (existingItemIndex === -1) {
      return of(currentCart); // Item not found
    }
    
    let updatedItems = [...currentCart.items];
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      updatedItems = updatedItems.filter((_, index) => index !== existingItemIndex);
    } else {
      // Update quantity
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: quantity
      };
    }
    
    const updatedCart = this.calculateCartTotals(updatedItems);
    
    if (this.authService.isLoggedIn()) {
      // Save to server if logged in
      return this.saveCartToServer(updatedCart).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          localStorage.setItem('cart', JSON.stringify(cart));
        })
      );
    } else {
      // Save to localStorage if not logged in
      this.cartSubject.next(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return of(updatedCart);
    }
  }

  /**
   * Removes an item from the cart
   */
  removeFromCart(productId: string, servingSize: string): Observable<Cart> {
    const currentCart = this.cartSubject.value;
    const updatedItems = currentCart.items.filter(
      item => !(item.productId === productId && item.servingSize === servingSize)
    );
    
    const updatedCart = this.calculateCartTotals(updatedItems);
    
    if (this.authService.isLoggedIn()) {
      // Save to server if logged in
      return this.saveCartToServer(updatedCart).pipe(
        tap(cart => {
          this.cartSubject.next(cart);
          localStorage.setItem('cart', JSON.stringify(cart));
        })
      );
    } else {
      // Save to localStorage if not logged in
      this.cartSubject.next(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return of(updatedCart);
    }
  }

  /**
   * Clears the entire cart
   */
  clearCart(): Observable<Cart> {
    const emptyCart: Cart = { items: [], totalQuantity: 0, totalPrice: 0 };
    
    if (this.authService.isLoggedIn()) {
      // Clear cart on server if logged in
      return this.http.delete<Cart>(`${this.apiUrl}`).pipe(
        map(() => emptyCart),
        tap(cart => {
          this.cartSubject.next(cart);
          localStorage.setItem('cart', JSON.stringify(cart));
        })
      );
    } else {
      // Clear cart in localStorage if not logged in
      this.cartSubject.next(emptyCart);
      localStorage.setItem('cart', JSON.stringify(emptyCart));
      return of(emptyCart);
    }
  }

  /**
   * Saves the current cart to the server
   */
  private saveCartToServer(cart: Cart): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}`, { items: cart.items }).pipe(
      map(response => {
        if (response && response.items) {
          return this.calculateCartTotals(response.items);
        }
        return cart;
      })
    );
  }

  /**
   * Merges local cart with server cart when user logs in
   */
  mergeCartsAfterLogin(): Observable<Cart> {
    const localCart = this.cartSubject.value;
    
    if (localCart.items.length === 0) {
      // If local cart is empty, just load from server
      return this.http.get<{ items: CartItem[] }>(`${this.apiUrl}`).pipe(
        map(response => {
          if (response && response.items) {
            const serverCart = this.calculateCartTotals(response.items);
            this.cartSubject.next(serverCart);
            localStorage.setItem('cart', JSON.stringify(serverCart));
            return serverCart;
          }
          return localCart;
        })
      );
    }
    
    // If local cart has items, merge with server by sending local cart to server
    return this.saveCartToServer(localCart).pipe(
      tap(mergedCart => {
        this.cartSubject.next(mergedCart);
        localStorage.setItem('cart', JSON.stringify(mergedCart));
      })
    );
  }
} 