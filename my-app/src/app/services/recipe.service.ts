import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, map } from 'rxjs';
import { throwError } from 'rxjs';
import { Recipe } from '../models/recipe.interface';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = 'http://localhost:3000/api/recipes';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error('Client-side error:', error.error.message);
    } else {
      // Server-side error
      console.error(
        `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`
      );
    }
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }

  private mapRecipeResponse(recipe: any): Recipe {
    return {
      _id: recipe._id,
      recipeName: recipe.recipeName,
      recipeImage: recipe.recipeImage,
      servingsOptions: recipe.servingsOptions || {},
      time: recipe.time || '',
      difficulty: recipe.difficulty || 'Trung bình',
      description: recipe.description || '',
      notes: recipe.notes || '',
      preparation: recipe.preparation || [],
      steps: recipe.steps || [],
      servingSuggestion: recipe.servingSuggestion || '',
      tips: recipe.tips || [],
      relatedRecipes: recipe.relatedRecipes || [],
      tags: recipe.tags || [],
      likes: recipe.likes || 0,
      region: recipe.region || '',
      category: recipe.category || 'Nước',
    };
  }

  getRecipes(): Observable<Recipe[]> {
    console.log('Fetching recipes from:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((recipes) => recipes.map((recipe) => this.mapRecipeResponse(recipe))),
      tap((recipes) => console.log('Received recipes:', recipes)),
      catchError(this.handleError)
    );
  }

  getRecipeById(id: string): Observable<Recipe> {
    const url = `${this.apiUrl}/${id}`;
    console.log('Fetching recipe by id from:', url);
    return this.http.get<any>(url).pipe(
      map((recipe) => this.mapRecipeResponse(recipe)),
      tap((recipe) => console.log('Received recipe:', recipe)),
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
}
