import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MenuIngredient {
  _id: string;
  ingredientName: string;
  mainImage: string;
  price: number;
  description?: string;
}

export interface Menu {
  _id: string;
  menuName: string;
  description: string;
  mainImage: string;
  subImage?: string;
  category: string;
  region: string;
  ingredients: MenuIngredient[];
  price: number;
  discount?: number;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = 'http://localhost:3000/api/menus';

  constructor(private http: HttpClient) {}

  getMenus(): Observable<Menu[]> {
    return this.http.get<{ status: string; data: Menu[] }>(this.apiUrl).pipe(
      map((response) => {
        console.log('Menus data from API:', response);
        return response.data;
      })
    );
  }

  getMenuById(id: string): Observable<Menu> {
    return this.http.get<{ status: string; data: Menu }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        console.log('Menu detail from API:', response);
        return response.data;
      })
    );
  }
} 