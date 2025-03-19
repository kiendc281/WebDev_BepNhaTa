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
  
  // FAQ
  faqs: FAQ[] = [
    {
      question: 'Thực đơn được cập nhật trong bao lâu?',
      answer: 'Thực đơn được cập nhật hàng tuần để đảm bảo sự đa dạng và phong phú.',
      isOpen: false
    },
    {
      question: 'Có thể thay đổi món ăn trong thực đơn không?',
      answer: 'Có, bạn có thể tùy chỉnh các món ăn trong thực đơn theo sở thích cá nhân.',
      isOpen: false
    },
    {
      question: 'Có thể đặt mua toàn bộ thực đơn không?',
      answer: 'Có, bạn có thể đặt mua toàn bộ thực đơn hoặc chỉ chọn những món mà bạn yêu thích.',
      isOpen: false
    }
  ];
  
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
    private favoritesService: FavoritesService
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
    // Thêm tất cả sản phẩm trong thực đơn vào giỏ hàng
    menuDay.meals.forEach(meal => {
      if (meal.product && meal.product.id) {
        this.addToCart(meal.product.id.toString());
      }
    });
  }
  
  addToCart(productId: string): void {
    // Thêm vào giỏ hàng
    console.log('Thêm vào giỏ hàng:', productId);
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
}
