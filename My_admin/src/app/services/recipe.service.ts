import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
      .pipe(timeout(this.requestTimeout));
  }

  // Lấy công thức theo ID
  getRecipeById(id: string): Observable<{ status: string; data: Recipe }> {
    return this.http
      .get<{ status: string; data: Recipe }>(`${this.apiUrl}/${id}`)
      .pipe(timeout(this.requestTimeout));
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

    return this.http
      .post<{ status: string; data: Recipe }>(this.apiUrl, recipe, { headers })
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

    return this.http
      .patch<{ status: string; data: Recipe }>(`${this.apiUrl}/${id}`, recipe, {
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
}
