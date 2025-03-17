import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, map, throwError } from 'rxjs';
import { Recipe } from '../models/recipe.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = `${environment.apiUrl}/recipes`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';

    console.log('Handling error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      name: error.name,
      message: error.message,
      error: error.error,
    });

    if (error.error instanceof ErrorEvent) {
      // Lỗi phía client
      console.error('Lỗi phía client:', error.error.message);
      errorMessage = error.error.message;
    } else {
      // Lỗi phía server
      console.error(`Mã lỗi ${error.status}, nội dung:`, error.error);

      // Kiểm tra nếu error.error có format {status: string, message: string}
      if (
        error.error &&
        typeof error.error === 'object' &&
        'message' in error.error
      ) {
        errorMessage = error.error.message;
      }
      // Nếu không có message từ error.error, dùng message mặc định theo status
      else {
        switch (error.status) {
          case 404:
            errorMessage = 'Không tìm thấy công thức.';
            break;
          case 500:
            errorMessage =
              'Lỗi server: Không thể tìm thấy hoặc xử lý công thức';
            break;
          default:
            errorMessage = `Lỗi ${error.status}: ${
              error.statusText || 'Không xác định'
            }`;
            break;
        }
      }
    }

    // Log thông báo lỗi cuối cùng
    console.log('Final error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private mapRecipeResponse(recipe: any): Recipe {
    if (!recipe || !recipe._id) {
      throw new Error('Dữ liệu công thức không hợp lệ');
    }

    try {
      return {
        _id: recipe._id,
        recipeName: recipe.recipeName || '',
        recipeImage: recipe.recipeImage || '',
        servingsOptions: recipe.servingsOptions || {},
        time: recipe.time || '',
        difficulty: recipe.difficulty || 'Trung bình',
        description: recipe.description || '',
        notes: recipe.notes || '',
        preparation: Array.isArray(recipe.preparation)
          ? recipe.preparation
          : [],
        steps: Array.isArray(recipe.steps) ? recipe.steps : [],
        servingSuggestion: recipe.servingSuggestion || '',
        tips: recipe.tips || '',
        relatedRecipes: Array.isArray(recipe.relatedRecipes)
          ? recipe.relatedRecipes
          : [],
        tags: Array.isArray(recipe.tags) ? recipe.tags : [],
        likes: typeof recipe.likes === 'number' ? recipe.likes : 0,
        region: recipe.region || '',
        category: recipe.category || '',
        relatedInfo: Array.isArray(recipe.relatedInfo)
          ? recipe.relatedInfo
          : recipe.relatedRecipes
          ? recipe.relatedRecipes.map((title: string) => ({
              title,
              link: `/cong-thuc/${title}`,
            }))
          : [],
      };
    } catch (error) {
      console.error('Lỗi khi chuyển đổi dữ liệu:', error);
      throw new Error('Dữ liệu công thức không hợp lệ');
    }
  }

  getRecipes(): Observable<Recipe[]> {
    console.log('Đang lấy danh sách công thức từ:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((response) => {
        if (!Array.isArray(response)) {
          throw new Error('Dữ liệu không hợp lệ');
        }
        return response.map((recipe) => this.mapRecipeResponse(recipe));
      }),
      tap((recipes) => console.log('Đã nhận được công thức:', recipes)),
      catchError(this.handleError)
    );
  }

  getRecipeById(id: string): Observable<Recipe> {
    if (!id) {
      return throwError(() => new Error('ID công thức không hợp lệ'));
    }

    const url = `${this.apiUrl}/${id}`;
    console.log('Đang lấy chi tiết công thức từ:', url);

    return this.http.get<any>(url).pipe(
      tap({
        next: (response) => {
          console.log('Raw server response:', response);
          if (response === null || response === undefined) {
            throw new Error('Server trả về response rỗng');
          }
        },
        error: (error) => {
          console.error('Lỗi khi nhận response:', error);
          if (error.error && error.error.message) {
            throw new Error(error.error.message);
          }
        },
      }),
      map((response) => {
        console.log('Đang xử lý response:', response);

        // Kiểm tra nếu response là error object
        if (response && response.status === 'error') {
          console.error('Server trả về error:', response);
          throw new Error(response.message || 'Lỗi từ server');
        }

        // Kiểm tra nếu response là object và có thuộc tính data
        if (response && response.data) {
          console.log('Response có data property:', response.data);
          return this.mapRecipeResponse(response.data);
        }

        // Kiểm tra nếu response trực tiếp là recipe
        if (response && response._id) {
          console.log('Response là recipe trực tiếp:', response);
          return this.mapRecipeResponse(response);
        }

        console.error('Response không đúng format:', response);
        throw new Error('Dữ liệu không đúng định dạng');
      }),
      catchError((error: HttpErrorResponse | Error) => {
        if (error instanceof HttpErrorResponse) {
          console.error('Chi tiết lỗi trong getRecipeById:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
          });
          return this.handleError(error);
        }
        return throwError(() => error);
      })
    );
  }

  getRecipesByRegion(region: string): Observable<Recipe[]> {
    const url = `${this.apiUrl}?region=${region}`;
    console.log('Đang lấy công thức theo vùng miền từ:', url);
    return this.http.get<any[]>(url).pipe(
      map((response) => {
        if (!Array.isArray(response)) {
          throw new Error('Dữ liệu không hợp lệ');
        }
        return response.map((recipe) => this.mapRecipeResponse(recipe));
      }),
      tap((recipes) =>
        console.log('Đã nhận được công thức theo vùng miền:', recipes)
      ),
      catchError(this.handleError)
    );
  }

  getRecipesByCategory(category: string): Observable<Recipe[]> {
    const url = `${this.apiUrl}?category=${category}`;
    console.log('Fetching recipes by category from:', url);
    return this.http.get<any[]>(url).pipe(
      map((recipes) => recipes.map((recipe) => this.mapRecipeResponse(recipe))),
      tap((recipes) => console.log('Received recipes by category:', recipes)),
      catchError(this.handleError)
    );
  }

  searchRecipes(query: string): Observable<Recipe[]> {
    const url = `${this.apiUrl}?search=${query}`;
    console.log('Searching recipes from:', url);
    return this.http.get<any[]>(url).pipe(
      map((recipes) => recipes.map((recipe) => this.mapRecipeResponse(recipe))),
      tap((recipes) => console.log('Received search results:', recipes)),
      catchError(this.handleError)
    );
  }

  getFeaturedRecipes(): Observable<Recipe[]> {
    const url = `${this.apiUrl}?featured=true`;
    console.log('Fetching featured recipes from:', url);
    return this.http.get<any[]>(url).pipe(
      map((recipes) => recipes.map((recipe) => this.mapRecipeResponse(recipe))),
      tap((recipes) => console.log('Received featured recipes:', recipes)),
      catchError(this.handleError)
    );
  }

  getPopularRecipes(): Observable<Recipe[]> {
    const url = `${this.apiUrl}?sort=rating`;
    console.log('Fetching popular recipes from:', url);
    return this.http.get<any[]>(url).pipe(
      map((recipes) => recipes.map((recipe) => this.mapRecipeResponse(recipe))),
      tap((recipes) => console.log('Received popular recipes:', recipes)),
      catchError(this.handleError)
    );
  }

  getTrendingRecipes(): Observable<Recipe[]> {
    return this.http
      .get<Recipe[]>(this.apiUrl)
      .pipe(
        map((recipes) => recipes.sort((a, b) => b.likes - a.likes).slice(0, 12))
      );
  }
}
