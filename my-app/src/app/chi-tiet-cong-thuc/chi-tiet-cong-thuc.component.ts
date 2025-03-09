import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-chi-tiet-cong-thuc',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './chi-tiet-cong-thuc.component.html',
  styleUrls: ['./chi-tiet-cong-thuc.component.css'],
  providers: [RecipeService],
})
export class ChiTietCongThucComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = false;
  errorMessage = '';
  selectedServingSize: string = '';
  activeTab: string = 'Nguyên liệu';

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadRecipe(id);
      }
    });
  }

  loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        if (this.recipe && this.recipe.servingsOptions) {
          this.selectedServingSize = Object.keys(
            this.recipe.servingsOptions
          )[0];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recipe:', error);
        this.errorMessage = 'Không thể tải công thức. Vui lòng thử lại sau.';
        this.isLoading = false;
      },
    });
  }

  onServingSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedServingSize = target.value;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getCurrentIngredients() {
    if (!this.recipe || !this.selectedServingSize) return [];
    return (
      this.recipe.servingsOptions[this.selectedServingSize]?.ingredients || []
    );
  }

  getTimeDisplay(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} giờ ${mins > 0 ? mins + ' phút' : ''}`;
    }
    return `${mins} phút`;
  }
}
