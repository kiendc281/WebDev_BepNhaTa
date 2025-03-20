import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartManagerService } from '../services/cart-manager.service';
import { SearchService, SearchResult } from '../services/search.service';
import { DangNhapComponent } from '../dang-nhap/dang-nhap.component';
import { DangKyComponent } from '../dang-ky/dang-ky.component';
import { QuenMatKhauComponent } from '../quen-mat-khau/quen-mat-khau.component';
import { Subscription, Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    DangNhapComponent,
    DangKyComponent,
    QuenMatKhauComponent,
  ],
  providers: [AuthService],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  showLoginPopup = false;
  currentForm = 'login'; // 'login', 'register', or 'forgot'
  mouseDownTarget: EventTarget | null = null;
  isMobileMenuOpen = false;
  activeDropdown: string | null = null;
  currentRoute: string = '';
  cartItemCount: number = 0;
  private cartSubscription: Subscription | null = null;
  
  // Biến cho chức năng tìm kiếm
  searchTerm: string = '';
  showSearchResults: boolean = false;
  searchResults: SearchResult = { recipes: [], products: [], blogs: [] };
  private searchTerms = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    private cartService: CartManagerService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    // Subscribe to router events to track the current route
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        // Handle query params
        if (this.currentRoute.includes('?')) {
          this.currentRoute = this.currentRoute.split('?')[0];
        }
      }
    });

    // Subscribe to cart changes
    this.cartSubscription = this.cartService.cartItems$.subscribe((items) => {
      this.cartItemCount = items.reduce((count, item) => count + item.quantity, 0);
    });
    
    // Thiết lập debounce cho tìm kiếm
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        // Luôn hiển thị dropdown kết quả khi có từ khóa, kể cả khi không có kết quả
        this.showSearchResults = term.trim().length > 0;
        return term.length < 2 
          ? of({ recipes: [], products: [], blogs: [] })
          : this.searchService.getSearchSuggestions(term);
      })
    ).subscribe(results => {
      this.searchResults = results;
      
      // Chỉ ẩn kết quả khi không có từ khóa tìm kiếm
      if (this.searchTerm.trim().length === 0) {
        this.showSearchResults = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  
  // Phương thức cho tìm kiếm
  onSearchInput(): void {
    this.searchTerms.next(this.searchTerm);
    // Bảo đảm hiển thị kết quả ngay khi có từ khóa nhập vào
    this.showSearchResults = this.searchTerm.trim().length > 0;
  }
  
  // Xử lý khi focus vào ô tìm kiếm
  onSearchFocus(): void {
    // Bảo đảm hiển thị kết quả khi focus vào ô tìm kiếm và có từ khóa
    if (this.searchTerm.trim().length > 0) {
      this.showSearchResults = true;
      
      // Nếu kết quả hiện tại trống, thực hiện tìm kiếm lại
      const hasResults = this.searchResults.recipes.length > 0 || 
                      this.searchResults.products.length > 0 || 
                      (this.searchResults.blogs && this.searchResults.blogs.length > 0);
                      
      if (!hasResults) {
        this.searchTerms.next(this.searchTerm);
      }
    }
  }
  
  search(): void {
    if (this.searchTerm.trim()) {
      this.showSearchResults = false;
      this.router.navigate(['/tim-kiem'], { 
        queryParams: { q: this.searchTerm.trim() } 
      });
    }
  }
  
  selectSearchResult(type: string, item: any): void {
    this.showSearchResults = false;
    
    if (type === 'recipe') {
      this.router.navigate(['/cong-thuc', item._id]);
    } else if (type === 'product') {
      this.router.navigate(['/san-pham', item._id]);
    } else if (type === 'blog') {
      this.router.navigate(['/blog', item._id]);
    }
  }
  
  // Đóng kết quả tìm kiếm khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(event.target as Node)) {
      this.showSearchResults = false;
    }
    
    // Xử lý đóng popup login (code đã có sẵn)
    if (event.target && (event.target as HTMLElement).classList.contains('popup-overlay') && 
        this.mouseDownTarget === event.target) {
      this.showLoginPopup = false;
    }
  }

  toggleLoginPopup() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/tai-khoan']);
    } else {
      this.showLoginPopup = !this.showLoginPopup;
      this.currentForm = 'login'; // Reset to login form when toggling
    }
  }

  onMouseDown(event: MouseEvent) {
    this.mouseDownTarget = event.target;
  }

  closeLoginPopup(event?: MouseEvent) {
    if (!event) {
      this.showLoginPopup = false;
      return;
    }

    if (
      (event.target as HTMLElement).classList.contains('popup-overlay') &&
      this.mouseDownTarget === event.target
    ) {
      this.showLoginPopup = false;
    }
  }

  switchToRegister() {
    this.currentForm = 'register';
  }

  switchToLogin() {
    this.currentForm = 'login';
  }

  switchToForgotPass() {
    this.currentForm = 'forgot';
  }

  navigateToLogin() {
    this.showLoginPopup = false;
    this.router.navigate(['/login']);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    
    if (mobileMenu && mobileMenuOverlay) {
      mobileMenu.classList.toggle('active', this.isMobileMenuOpen);
      mobileMenuOverlay.classList.toggle('active', this.isMobileMenuOpen);
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    mobileMenu?.classList.remove('active');
    mobileMenuOverlay?.classList.remove('active');
  }

  toggleDropdown(dropdown: string, event: Event) {
    event.preventDefault();
    this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
  }
}
