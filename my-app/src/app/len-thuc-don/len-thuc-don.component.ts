import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MenuService, Menu } from '../services/menu.service';
import { ProductService } from '../services/product.service';
import { RecipeService } from '../services/recipe.service';
import { FormsModule } from '@angular/forms';
import { Recipe } from '../models/recipe.interface';
import { Product } from '../models/product.interface';
import { CleanTitlePipe } from './clean-title.pipe';
import { FavoritesService } from '../services/favorites.service';
import { UserCartService } from '../services/user-cart.service';
import { GuestCartService } from '../services/guest-cart.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

interface MenuDay {
  day: number;
  name: string;
  meals: {
    type: string;
    product: Product;
  }[];
}

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-len-thuc-don',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, CleanTitlePipe],
  templateUrl: './len-thuc-don.component.html',
  styleUrl: './len-thuc-don.component.css',
  providers: [MenuService, ProductService, RecipeService, FavoritesService]
})
export class LenThucDonComponent implements OnInit {
  menus: Menu[] = [];
  recipes: Recipe[] = [];
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';
  
  // Thực đơn theo ngày
  allMenuDays: MenuDay[] = []; // Tất cả các thực đơn
  visibleMenuDays: MenuDay[] = []; // Thực đơn hiển thị
  currentMenuPage = 0;
  menusPerPage = 4; // Số thực đơn hiển thị mỗi trang
  
  // Công thức gợi ý
  suggestedRecipes: Recipe[] = [];
  
  // Lưu trữ ID các công thức đã lưu
  savedRecipes = new Set<string>();
  
  currentRecipePage = 0;
  recipesPerPage = 3;
  visibleRecipes: any[] = [];
  
  // Khai báo thêm biến để quản lý thông báo
  notificationMessage = '';
  notificationVisible = false;
  notificationType = 'success'; // 'success' hoặc 'error'
  
  constructor(
    private menuService: MenuService,
    private productService: ProductService,
    private recipeService: RecipeService,
    private favoritesService: FavoritesService,
    private userCartService: UserCartService,
    private guestCartService: GuestCartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadRecipes();
  }
  
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.createMenuDays();
        this.updateVisibleMenus();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải sản phẩm:', err);
        this.errorMessage = 'Không thể tải thực đơn. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }
  
  loadRecipes(): void {
    this.recipeService.getRecipes().subscribe({
      next: (data) => {
        this.recipes = data;
        this.suggestedRecipes = this.getRandomRecipes(9); // Lấy 9 công thức để có thể phân trang
        this.updateVisibleRecipes(); // Cập nhật visibleRecipes ngay sau khi có dữ liệu
        this.loadSavedRecipes(); // Load trạng thái đã lưu sau khi có dữ liệu công thức
      },
      error: (err) => {
        console.error('Lỗi khi tải công thức:', err);
      }
    });
  }
  
  createMenuDays(): void {
    // Tạo dữ liệu mẫu cho 7 thực đơn
    const mealTypes = ['Sáng', 'Trưa', 'Tối'];
    
    for (let i = 1; i <= 7; i++) {
      const menuDay: MenuDay = {
        day: i,
        name: `Ngày ${i}`,
        meals: []
      };
      
      // Mỗi ngày có 3 bữa (sáng, trưa, tối)
      mealTypes.forEach(type => {
        // Lấy ngẫu nhiên một sản phẩm cho mỗi bữa
        const randomProduct = this.getRandomProduct();
        if (randomProduct) {
          menuDay.meals.push({
            type,
            product: randomProduct
          });
        }
      });
      
      this.allMenuDays.push(menuDay);
    }
  }

  // Cập nhật các thực đơn hiển thị theo trang hiện tại
  updateVisibleMenus(): void {
    const startIndex = this.currentMenuPage * this.menusPerPage;
    this.visibleMenuDays = this.allMenuDays.slice(startIndex, startIndex + this.menusPerPage);
  }

  // Chuyển tới trang thực đơn tiếp theo
  nextMenuPage(): void {
    const totalPages = Math.ceil(this.allMenuDays.length / this.menusPerPage);
    if (this.currentMenuPage < totalPages - 1) {
      this.currentMenuPage++;
      this.updateVisibleMenus();
    }
  }

  // Quay lại trang thực đơn trước
  prevMenuPage(): void {
    if (this.currentMenuPage > 0) {
      this.currentMenuPage--;
      this.updateVisibleMenus();
    }
  }
  
  getRandomProduct(): Product | null {
    if (this.products.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];
    
    // Add mappings for backward compatibility
    return {
      ...product,
      id: product._id,
      title: product.ingredientName,
      image: product.mainImage
    };
  }
  
  getRandomRecipes(count: number): Recipe[] {
    if (this.recipes.length === 0) return [];
    const shuffled = [...this.recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  toggleFaq(faq: FAQ): void {
    faq.isOpen = !faq.isOpen;
  }
  
  buyNow(productId: number): void {
    // Xử lý mua hàng
    console.log('Mua ngay sản phẩm:', productId);
  }
  
  // Mua cả thực đơn
  buyMenu(menuDay: MenuDay): void {
    console.log('Mua thực đơn:', menuDay.day);
    
    // Kiểm tra trước nếu có sản phẩm nào trong thực đơn
    if (!menuDay.meals || menuDay.meals.length === 0) {
      this.showNotification('Không có sản phẩm nào trong thực đơn này', 'error');
      return;
    }

    // Hiển thị thông báo đang xử lý
    this.showNotification('Đang xử lý thêm sản phẩm vào giỏ hàng...', 'success');

    // Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
    const mealItems = [...menuDay.meals].filter(meal => meal.product && meal.product._id);
    
    // Nếu không có sản phẩm hợp lệ
    if (mealItems.length === 0) {
      this.showNotification('Không có sản phẩm hợp lệ nào trong thực đơn này', 'error');
      return;
    }

    console.log(`Chuẩn bị xử lý ${mealItems.length} sản phẩm từ thực đơn ngày ${menuDay.day}`);
    
    let productsAdded = 0;
    let failedProducts = 0;
    let outOfStockProducts: string[] = [];
    const totalProducts = mealItems.length;

    // Sử dụng cờ để theo dõi khi nào tất cả được xử lý
    let allProcessed = false;
    
    // Hàm kiểm tra khi tất cả các sản phẩm đã được xử lý
    const finalizeProcess = () => {
      if (allProcessed) return; // Đảm bảo chỉ chạy một lần
      
      allProcessed = true;
      console.log(`Đã hoàn thành việc xử lý: ${productsAdded} thành công, ${failedProducts} thất bại`);
      
      // Hiển thị thông báo khi tất cả sản phẩm đã được xử lý
      if (productsAdded > 0) {
        let message = `Đã thêm ${productsAdded}/${totalProducts} sản phẩm vào giỏ hàng`;
        
        if (outOfStockProducts.length > 0) {
          // Hiển thị thông báo cụ thể về sản phẩm hết hàng
          message += `. Các sản phẩm: ${outOfStockProducts.join(', ')} không đủ số lượng trong kho.`;
          this.showNotification(message, 'error');
        } else if (failedProducts > 0) {
          message += ` (${failedProducts} sản phẩm không thành công)`;
          this.showNotification(message, 'error');
        } else {
          this.showNotification(message, 'success');
        }
        
        // Chỉ chuyển đến trang giỏ hàng nếu đã thêm ít nhất một sản phẩm
        setTimeout(() => {
          this.router.navigate(['/gio-hang']);
        }, 2000);
      } else if (failedProducts > 0) {
        if (outOfStockProducts.length > 0) {
          this.showNotification(`Không thể thêm sản phẩm vào giỏ hàng. Các sản phẩm: ${outOfStockProducts.join(', ')} không đủ số lượng trong kho.`, 'error');
        } else {
          this.showNotification('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng kiểm tra lại hàng tồn kho.', 'error');
        }
      } else {
        this.showNotification('Không có sản phẩm nào được thêm vào giỏ hàng', 'error');
      }
    };
    
    // Hàm xử lý thêm sản phẩm vào giỏ hàng
    const processNextItem = (index: number) => {
      // Nếu đã xử lý hết các sản phẩm
      if (index >= mealItems.length) {
        finalizeProcess();
        return;
      }
      
      const meal = mealItems[index];
      const product = meal.product;
      
      if (!product || !product._id) {
        console.warn('Sản phẩm không hợp lệ tại vị trí', index);
        failedProducts++;
        processNextItem(index + 1);
        return;
      }
      
      console.log(`Đang xử lý sản phẩm ${index + 1}/${mealItems.length}: ${this.getProductTitle(product)}`);
      
      // Tính toán giá và thêm vào giỏ hàng
      const quantity = 1;
      const servingSize = "2";
      let price = this.calculateProductPrice(product, servingSize);
      const finalPrice = Math.round(price);

      // In ra cấu trúc pricePerPortion để debug
      console.log('Chi tiết giá và khẩu phần:', {
        productName: this.getProductTitle(product),
        pricePerPortion: product.pricePerPortion,
        pricePerPortionArray: product.pricePerPortionArray,
        selectedPortion: servingSize,
        calculatedPrice: finalPrice
      });

      // Kiểm tra người dùng đã đăng nhập chưa
      if (this.authService.isLoggedIn()) {
        // Nếu đã đăng nhập, sử dụng UserCartService
        this.userCartService.addToCart(product, quantity, servingSize, finalPrice)
          .subscribe({
            next: () => {
              console.log(`Thêm thành công: ${this.getProductTitle(product)}`);
              productsAdded++;
              processNextItem(index + 1);
            },
            error: (error) => {
              failedProducts++;
              
              // Chi tiết lỗi để debug
              console.error(`Lỗi khi thêm sản phẩm ${this.getProductTitle(product)}:`, error);
              
              // Kiểm tra lỗi không đủ số lượng
              let errorMsg = '';
              if (error && typeof error === 'object') {
                if ('message' in error) {
                  errorMsg = String(error.message);
                } else if ('error' in error && typeof error.error === 'object' && error.error && 'message' in error.error) {
                  errorMsg = String(error.error.message);
                }
                
                console.log(`Chi tiết lỗi: ${errorMsg}`);
                
                if (errorMsg.includes('không đủ số lượng') || errorMsg.includes('out of stock')) {
                  const productName = this.getProductTitle(product);
                  if (productName && !outOfStockProducts.includes(productName)) {
                    outOfStockProducts.push(productName);
                  }
                }
              }
              
              processNextItem(index + 1);
            }
          });
      } else {
        // Nếu chưa đăng nhập, sử dụng GuestCartService
        try {
          this.guestCartService.addToLocalCart(product, quantity, servingSize, finalPrice);
          console.log(`Thêm thành công vào giỏ khách: ${this.getProductTitle(product)}`);
          productsAdded++;
        } catch (error) {
          failedProducts++;
          
          // Chi tiết lỗi để debug
          console.error(`Lỗi khi thêm sản phẩm ${this.getProductTitle(product)} vào giỏ khách:`, error);
          
          // Xử lý lỗi cho guest cart tương tự
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = String(error.message);
            console.log(`Chi tiết lỗi: ${errorMsg}`);
            
            if (errorMsg.includes('không đủ số lượng') || errorMsg.includes('out of stock')) {
              const productName = this.getProductTitle(product);
              if (productName && !outOfStockProducts.includes(productName)) {
                outOfStockProducts.push(productName);
              }
            }
          }
        }
        
        // Xử lý sản phẩm tiếp theo
        processNextItem(index + 1);
      }
    };
    
    // Bắt đầu xử lý từ sản phẩm đầu tiên
    processNextItem(0);
  }
  
  // Tách logic tính giá thành một phương thức riêng
  calculateProductPrice(product: Product, servingSize: string): number {
    // Tính toán giá theo quy tắc ưu tiên
    let price = 0;
    
    // 1. Ưu tiên lấy giá từ pricePerPortion
    if (product.pricePerPortion && typeof product.pricePerPortion === 'object') {
      // Tìm khẩu phần phù hợp
      if (product.pricePerPortion[servingSize]) {
        price = product.pricePerPortion[servingSize];
      } else {
        // Nếu không tìm thấy khẩu phần chính xác, lấy giá đầu tiên có sẵn
        const availablePortions = Object.keys(product.pricePerPortion);
        if (availablePortions.length > 0) {
          const firstPortion = availablePortions[0];
          price = product.pricePerPortion[firstPortion];
        }
      }
    } 
    // 2. Nếu không có trong pricePerPortion, thử lấy từ pricePerPortionArray
    else if (product.pricePerPortionArray && Array.isArray(product.pricePerPortionArray) && product.pricePerPortionArray.length > 0) {
      // Tìm khẩu phần phù hợp
      const portionItem = product.pricePerPortionArray.find(p => p.portion === servingSize);
      if (portionItem) {
        price = portionItem.price;
      } else {
        // Nếu không tìm thấy khẩu phần chính xác, lấy giá đầu tiên có sẵn
        price = product.pricePerPortionArray[0].price;
      }
    }
    
    // 3. Nếu không có thông tin giá, sử dụng giá mặc định
    if (price <= 0) {
      price = 100000; // Giá mặc định nếu không tìm thấy
    }
    
    // 4. Áp dụng giảm giá nếu có
    if (product.discount && product.discount > 0) {
      const discountAmount = price * (product.discount / 100);
      price = price - discountAmount;
    }
    
    return price;
  }

  updateVisibleRecipes() {
    const start = this.currentRecipePage * this.recipesPerPage;
    const end = start + this.recipesPerPage;
    this.visibleRecipes = this.suggestedRecipes.slice(start, end);
  }

  prevRecipePage() {
    if (this.currentRecipePage > 0) {
      this.currentRecipePage--;
      this.updateVisibleRecipes();
    }
  }

  nextRecipePage() {
    if (this.currentRecipePage < Math.ceil(this.suggestedRecipes.length / this.recipesPerPage) - 1) {
      this.currentRecipePage++;
      this.updateVisibleRecipes();
    }
  }

  // Helper methods for template to avoid errors
  getProductTitle(product: Product): string {
    return product.title || product.ingredientName || '';
  }
  
  getProductImage(product: Product): string {
    return product.image || product.mainImage || '';
  }
  
  // View product details
  viewProductDetails(product: Product): void {
    // Navigate to product details page
    console.log('View product details:', product);
    // You can implement routing to the product details page here
    // this.router.navigate(['/san-pham', product._id]);
  }

  loadSavedRecipes(): void {
    // Lấy user từ localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      // Nếu không có user, không cần kiểm tra các công thức đã lưu
      return;
    }

    // Với mỗi công thức, kiểm tra xem đã lưu chưa
    this.suggestedRecipes.forEach(recipe => {
      if (recipe && recipe._id) {
        this.favoritesService.checkFavorite(recipe._id, 'recipe').subscribe(
          isSaved => {
            if (isSaved) {
              this.savedRecipes.add(recipe._id);
            }
          }
        );
      }
    });
  }

  isRecipeSaved(recipeId: string): boolean {
    // Kiểm tra trực tiếp từ Set đã lưu
    return this.savedRecipes.has(recipeId);
  }

  // Hiển thị thông báo
  showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.notificationVisible = true;
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      this.notificationVisible = false;
    }, 3000);
  }

  toggleSaveRecipe(event: Event, recipe: any): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Kiểm tra nếu người dùng đã đăng nhập
    if (!localStorage.getItem('user')) {
      this.showNotification('Vui lòng đăng nhập để lưu công thức', 'error');
      return;
    }

    if (!recipe || !recipe._id) {
      console.error('Recipe or recipe ID is missing');
      return;
    }

    const recipeId = recipe._id;
    const isSaved = this.isRecipeSaved(recipeId);
    const recipeName = recipe.recipeName || 'Công thức';

    // Cập nhật UI ngay lập tức
    if (isSaved) {
      this.savedRecipes.delete(recipeId);
      this.showNotification(`Đã xóa "${recipeName}" khỏi danh sách yêu thích`);
    } else {
      this.savedRecipes.add(recipeId);
      this.showNotification(`Đã thêm "${recipeName}" vào danh sách yêu thích`);
    }

    console.log('Toggle save recipe', recipeId);
    
    this.favoritesService
      .toggleFavorite(recipeId, 'recipe', isSaved)
      .subscribe({
        next: (response) => {
          console.log('Toggle favorite response:', response);
        },
        error: (error) => {
          // Nếu có lỗi, hoàn tác thay đổi UI
          if (isSaved) {
            this.savedRecipes.add(recipeId);
            this.showNotification(`Lỗi khi xóa khỏi danh sách yêu thích`, 'error');
          } else {
            this.savedRecipes.delete(recipeId);
            this.showNotification(`Lỗi khi thêm vào danh sách yêu thích`, 'error');
          }

          console.error('Error toggling favorite:', error);
        },
      });
  }

  // Thêm sản phẩm vào giỏ hàng
  addToCart(product: Product): void {
    if (!product || !product._id) {
      console.error('Sản phẩm không hợp lệ', product);
      return;
    }
    
    const quantity = 1; // Số lượng mặc định
    const servingSize = "2"; // Khẩu phần mặc định
    
    // Tính toán giá sản phẩm
    const price = this.calculateProductPrice(product, servingSize);
    const finalPrice = Math.round(price);
    
    console.log('Thêm vào giỏ hàng:', { 
      productId: product._id, 
      productName: product.ingredientName || product.title,
      quantity, 
      servingSize, 
      price: finalPrice
    });
    
    // In ra cấu trúc pricePerPortion để debug
    console.log('Chi tiết giá và khẩu phần:', {
      pricePerPortion: product.pricePerPortion,
      pricePerPortionArray: product.pricePerPortionArray,
      selectedPortion: servingSize
    });
    
    // Hiển thị thông báo đang xử lý
    this.showNotification('Đang thêm sản phẩm vào giỏ hàng...', 'success');
    
    // Kiểm tra người dùng đã đăng nhập chưa
    if (this.authService.isLoggedIn()) {
      // Nếu đã đăng nhập, sử dụng UserCartService
      this.userCartService.addToCart(product, quantity, servingSize, finalPrice)
        .subscribe({
          next: (cart) => {
            console.log('Đã thêm sản phẩm vào giỏ hàng người dùng:', cart);
            const productName = product.ingredientName || product.title || 'Sản phẩm';
            this.showNotification(`Đã thêm ${productName} vào giỏ hàng`, 'success');
          },
          error: (error) => {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng người dùng:', error);
            
            // Chi tiết lỗi để debug
            if (error && typeof error === 'object') {
              console.log('Chi tiết lỗi HTTP:', JSON.stringify(error));
            }
            
            // Xử lý lỗi cụ thể
            let errorMessage = 'Lỗi không xác định';
            
            if (error && typeof error === 'object') {
              if ('message' in error) {
                errorMessage = String(error.message);
              } else if ('error' in error && typeof error.error === 'object' && error.error && 'message' in error.error) {
                errorMessage = String(error.error.message);
              }
              
              if (errorMessage.includes('không đủ số lượng') || errorMessage.includes('out of stock')) {
                const productName = product.ingredientName || product.title || 'Sản phẩm';
                this.showNotification(`Sản phẩm ${productName} không đủ số lượng trong kho`, 'error');
                return;
              }
            }
            
            this.showNotification(`Không thể thêm sản phẩm vào giỏ hàng: ${errorMessage}`, 'error');
          }
        });
    } else {
      // Nếu chưa đăng nhập, sử dụng GuestCartService
      try {
        this.guestCartService.addToLocalCart(product, quantity, servingSize, finalPrice);
        console.log('Đã thêm sản phẩm vào giỏ hàng khách:', product.ingredientName || product.title);
        const productName = product.ingredientName || product.title || 'Sản phẩm';
        this.showNotification(`Đã thêm ${productName} vào giỏ hàng`, 'success');
      } catch (error) {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng khách:', error);
        
        // Kiểm tra loại lỗi
        let errorMessage = 'Lỗi không xác định';
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String(error.message);
          
          if (errorMessage.includes('không đủ số lượng') || errorMessage.includes('out of stock')) {
            const productName = product.ingredientName || product.title || 'Sản phẩm';
            this.showNotification(`Sản phẩm ${productName} không đủ số lượng trong kho`, 'error');
            return;
          }
        }
        
        this.showNotification(`Không thể thêm sản phẩm vào giỏ hàng: ${errorMessage}`, 'error');
      }
    }
  }
}
