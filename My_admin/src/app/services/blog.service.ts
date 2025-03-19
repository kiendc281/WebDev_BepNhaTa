import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Blog } from '../models/blog.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs';

  constructor(private http: HttpClient) {}

  getBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(this.apiUrl);
  }

  getBlogById(id: string): Observable<Blog> {
    return this.http.get<Blog>(`${this.apiUrl}/${id}`);
  }

  createBlog(blog: Blog): Observable<Blog> {
    return this.http.post<Blog>(this.apiUrl, blog);
  }

  updateBlog(id: string, blog: Blog): Observable<Blog> {
    return this.http.put<Blog>(`${this.apiUrl}/${id}`, blog);
  }

  deleteBlog(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
