import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';

@Component({
  selector: 'app-recipes-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './recipes-detail.component.html',
  styleUrls: ['./recipes-detail.component.css']
})
export class RecipesDetailComponent implements OnInit {
  // Khởi tạo recipe với giá trị mặc định rỗng khi tạo mới
  recipe: Recipe = {
    _id: '',
    recipeName: '',
    recipeImage: '',
    servingsOptions: {
      '2': {
        ingredients: []
      },
      '4': {
        ingredients: []
      }
    },
    time: '',
    difficulty: 'Trung bình',
    description: '',
    notes: '',
    preparation: [],
    steps: [],
    servingSuggestion: '',
    tips: '',
    tags: [],
    likes: 0,
    region: '',
    category: ''
  };

  isEdit: boolean = false;
  pendingChanges: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    // Kiểm tra nếu đang sửa công thức hiện có
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEdit = true;
        this.loadRecipe(params['id']);
      }
    });
  }

  // Tải thông tin công thức
  loadRecipe(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.recipeService.getRecipeById(id).subscribe({
      next: (response: any) => {
        console.log('API response:', response);
        
        let recipeData: Recipe;
        
        // Xử lý dữ liệu trả về từ API
        if (response && response.data) {
          // Nếu API trả về dữ liệu trong trường data
          recipeData = response.data;
        } else {
          // Nếu API trả về dữ liệu trực tiếp
          recipeData = response as Recipe;
        }
        
        if (recipeData) {
          this.recipe = recipeData;
          
          // Đảm bảo cấu trúc servingsOptions luôn đúng
          if (!this.recipe.servingsOptions) {
            this.recipe.servingsOptions = {
              '2': { ingredients: [] },
              '4': { ingredients: [] }
            };
          } else {
            if (!this.recipe.servingsOptions['2']) {
              this.recipe.servingsOptions['2'] = { ingredients: [] };
            } else if (!this.recipe.servingsOptions['2'].ingredients) {
              this.recipe.servingsOptions['2'].ingredients = [];
            }
            
            if (!this.recipe.servingsOptions['4']) {
              this.recipe.servingsOptions['4'] = { ingredients: [] };
            } else if (!this.recipe.servingsOptions['4'].ingredients) {
              this.recipe.servingsOptions['4'].ingredients = [];
            }
          }
          
          // Đảm bảo các trường khác có giá trị mặc định
          if (!this.recipe.preparation) this.recipe.preparation = [];
          if (!this.recipe.steps) this.recipe.steps = [];
          if (!this.recipe.tags) this.recipe.tags = [];
          
          console.log('Recipe data processed:', this.recipe);
        } else {
          this.errorMessage = 'Không tìm thấy công thức';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải công thức:', error);
        this.errorMessage = 'Đã xảy ra lỗi khi tải dữ liệu công thức';
        this.isLoading = false;
      }
    });
  }

  // Xử lý khi có thay đổi trong form
  onInputChange(): void {
    this.pendingChanges = true;
  }

  // Thêm nguyên liệu mới cho khẩu phần 2 người
  addIngredient2(): void {
    if (!this.recipe.servingsOptions['2'].ingredients) {
      this.recipe.servingsOptions['2'].ingredients = [];
    }
    this.recipe.servingsOptions['2'].ingredients.push({ name: '', quantity: '' });
    this.onInputChange();
  }

  // Xóa nguyên liệu cho khẩu phần 2 người
  removeIngredient2(index: number): void {
    this.recipe.servingsOptions['2'].ingredients.splice(index, 1);
    this.onInputChange();
  }

  // Thêm nguyên liệu mới cho khẩu phần 4 người
  addIngredient4(): void {
    if (!this.recipe.servingsOptions['4'].ingredients) {
      this.recipe.servingsOptions['4'].ingredients = [];
    }
    this.recipe.servingsOptions['4'].ingredients.push({ name: '', quantity: '' });
    this.onInputChange();
  }

  // Xóa nguyên liệu cho khẩu phần 4 người
  removeIngredient4(index: number): void {
    this.recipe.servingsOptions['4'].ingredients.splice(index, 1);
    this.onInputChange();
  }

  // Thêm bước chuẩn bị mới
  addPreparation(): void {
    this.recipe.preparation.push('');
    this.onInputChange();
  }

  // Xóa bước chuẩn bị
  removePreparation(index: number): void {
    this.recipe.preparation.splice(index, 1);
    this.onInputChange();
  }

  // Thêm bước thực hiện mới
  addStep(): void {
    this.recipe.steps.push('');
    this.onInputChange();
  }

  // Xóa bước thực hiện
  removeStep(index: number): void {
    this.recipe.steps.splice(index, 1);
    this.onInputChange();
  }

  // Xử lý tải ảnh
  uploadImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Giả lập tải ảnh lên
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.recipe.recipeImage = e.target.result;
        this.onInputChange();
      };
      reader.readAsDataURL(file);
    }
  }

  // Kích hoạt input file
  triggerFileInput(): void {
    document.getElementById('recipe-image')?.click();
  }

  // Thêm tag
  addTag(event: Event, tagInput: HTMLInputElement): void {
    event.preventDefault();
    const tagValue = tagInput.value.trim();
    
    if (tagValue) {
      // Nếu có dấu phẩy, tách thành nhiều tag
      const tags = tagValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      tags.forEach(tag => {
        if (!this.recipe.tags.includes(tag)) {
          this.recipe.tags.push(tag);
        }
      });
      
      tagInput.value = '';
      this.onInputChange();
    }
  }

  // Xóa tag
  removeTag(tag: string): void {
    const index = this.recipe.tags.indexOf(tag);
    if (index !== -1) {
      this.recipe.tags.splice(index, 1);
      this.onInputChange();
    }
  }

  // Lưu công thức
  saveRecipe(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Kiểm tra và làm sạch dữ liệu trước khi gửi
    this.validateRecipeData();
    
    if (this.isEdit) {
      // Cập nhật công thức hiện có
      this.recipeService.updateRecipe(this.recipe._id, this.recipe).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.pendingChanges = false;
            this.router.navigate(['/cong-thuc']);
          } else {
            this.errorMessage = 'Không thể cập nhật công thức';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật công thức:', error);
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật công thức';
          this.isLoading = false;
        }
      });
    } else {
      // Tạo công thức mới
      this.recipeService.createRecipe(this.recipe).subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.pendingChanges = false;
            this.router.navigate(['/cong-thuc']);
          } else {
            this.errorMessage = 'Không thể tạo công thức mới';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tạo công thức mới:', error);
          this.errorMessage = 'Đã xảy ra lỗi khi tạo công thức mới';
          this.isLoading = false;
        }
      });
    }
  }

  // Kiểm tra và làm sạch dữ liệu
  private validateRecipeData(): void {
    // Loại bỏ các nguyên liệu trống
    if (this.recipe.servingsOptions['2'] && this.recipe.servingsOptions['2'].ingredients) {
      this.recipe.servingsOptions['2'].ingredients = this.recipe.servingsOptions['2'].ingredients.filter(
        ingredient => ingredient.name.trim() !== '' || ingredient.quantity.trim() !== ''
      );
    }
    
    if (this.recipe.servingsOptions['4'] && this.recipe.servingsOptions['4'].ingredients) {
      this.recipe.servingsOptions['4'].ingredients = this.recipe.servingsOptions['4'].ingredients.filter(
        ingredient => ingredient.name.trim() !== '' || ingredient.quantity.trim() !== ''
      );
    }
    
    // Loại bỏ các bước chuẩn bị trống
    this.recipe.preparation = this.recipe.preparation.filter(step => step.trim() !== '');
    
    // Loại bỏ các bước thực hiện trống
    this.recipe.steps = this.recipe.steps.filter(step => step.trim() !== '');
  }

  // Hủy và quay lại
  cancel(): void {
    if (this.pendingChanges) {
      if (confirm('Bạn có chắc muốn hủy các thay đổi?')) {
        this.router.navigate(['/cong-thuc']);
      }
    } else {
      this.router.navigate(['/cong-thuc']);
    }
  }
}
