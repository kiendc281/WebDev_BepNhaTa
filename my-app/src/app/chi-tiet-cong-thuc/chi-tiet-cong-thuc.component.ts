import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.interface';
import { HttpClientModule } from '@angular/common/http';

interface IngredientPackage {
  id: string;
  name: string;
  image: string;
  price: number;
}

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
  isLoading = true;
  errorMessage = '';
  selectedServingSize: string = '4';
  ingredientPackages: IngredientPackage[] = [];
  activeTab: string = 'Nguyên liệu';
  activeSection: string = 'description';

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

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.updateActiveSection();
  }

  updateActiveSection() {
    const sections = [
      'description',
      'ingredients',
      'preparation',
      'steps',
      'serving',
      'tips',
    ];

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.activeSection = sectionId;
    }
  }

  isActiveSection(sectionId: string): boolean {
    return this.activeSection === sectionId;
  }

  loadRecipe(id: string): void {
    this.isLoading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        if (this.recipe && this.recipe.servingsOptions) {
          this.selectedServingSize = Object.keys(
            this.recipe.servingsOptions
          ).includes('4')
            ? '4'
            : Object.keys(this.recipe.servingsOptions)[0];
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

  getServingSizes(): string[] {
    if (!this.recipe || !this.recipe.servingsOptions) return [];
    return Object.keys(this.recipe.servingsOptions);
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
}
