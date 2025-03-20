import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, map } from 'rxjs/operators';
import { Recipe } from '../models/recipe.interface';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = 'http://localhost:3000/api/recipes';
  private requestTimeout = 120000; // 2 phút

  constructor(private http: HttpClient) {}

  // Lấy tất cả công thức (có thể lọc theo nhiều tiêu chí)
  getAllRecipes(filters?: {
    category?: string;
    region?: string;
    search?: string;
  }): Observable<Recipe[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.region) params = params.set('region', filters.region);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http
      .get<Recipe[]>(this.apiUrl, { params })
      .pipe(
        timeout(this.requestTimeout),
        map(recipes => this.processRecipesData(recipes))
      );
  }

  // Lấy công thức theo ID
  getRecipeById(id: string): Observable<{ status: string; data: Recipe }> {
    return this.http
      .get<{ status: string; data: Recipe }>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(this.requestTimeout),
        map(response => {
          // Xử lý cả hai trường hợp: response là object có data hoặc response là recipe trực tiếp
          if (response && response.data) {
            return {
              status: response.status,
              data: this.processRecipeData(response.data)
            };
          } else {
            // Nếu API trả về recipe trực tiếp
            return {
              status: 'success',
              data: this.processRecipeData(response as any)
            };
          }
        })
      );
  }

  // Tạo công thức mới
  createRecipe(
    recipe: Partial<Recipe>
  ): Observable<{ status: string; data: Recipe }> {
    if (!recipe) {
      throw new Error('Dữ liệu công thức không được để trống');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    // Chuẩn hóa dữ liệu trước khi gửi lên server
    const processedRecipe = this.prepareRecipeForSubmission(recipe);

    return this.http
      .post<{ status: string; data: Recipe }>(this.apiUrl, processedRecipe, { headers })
      .pipe(timeout(this.requestTimeout));
  }

  // Cập nhật công thức
  updateRecipe(
    id: string,
    recipe: Partial<Recipe>
  ): Observable<{ status: string; data: Recipe }> {
    if (!id) {
      throw new Error('ID công thức không được để trống');
    }

    if (!recipe) {
      throw new Error('Dữ liệu công thức không được để trống');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    // Chuẩn hóa dữ liệu trước khi gửi lên server
    const processedRecipe = this.prepareRecipeForSubmission(recipe);

    return this.http
      .patch<{ status: string; data: Recipe }>(`${this.apiUrl}/${id}`, processedRecipe, {
        headers,
      })
      .pipe(timeout(this.requestTimeout));
  }

  // Xóa công thức
  deleteRecipe(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/${id}`
    );
  }

  // Xử lý dữ liệu recipe để đảm bảo kiểu dữ liệu đúng
  private processRecipeData(recipe: Recipe): Recipe {
    if (!recipe) return recipe;

    // Đảm bảo likes là số
    if (recipe.likes !== undefined) {
      recipe.likes = parseInt(String(recipe.likes)) || 0;
    }

    // Xử lý các trường khác nếu cần
    return recipe;
  }

  // Xử lý mảng recipes
  private processRecipesData(recipes: Recipe[]): Recipe[] {
    if (!recipes || !Array.isArray(recipes)) return recipes;
    return recipes.map(recipe => this.processRecipeData(recipe));
  }

  // Chuẩn bị dữ liệu recipe trước khi gửi lên server
  private prepareRecipeForSubmission(recipe: Partial<Recipe>): Partial<Recipe> {
    const processedRecipe = {...recipe};
    
    // Đảm bảo likes là số
    if (processedRecipe.likes !== undefined) {
      processedRecipe.likes = parseInt(String(processedRecipe.likes)) || 0;
    }

    // Xử lý các trường khác nếu cần
    return processedRecipe;
  }
}
