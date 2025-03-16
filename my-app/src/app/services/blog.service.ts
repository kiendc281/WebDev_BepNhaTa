import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BlogPost } from '../models/blog.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs';

  constructor(private http: HttpClient) {}

  private mapResponseToBlogPosts(items: any[]): BlogPost[] {
    return items.map(item => ({
      _id: item._id || '',
      title: item.title || '',
      slug: item.slug || '',
      category: {
        name: item.category?.name || 'Chưa phân loại',
        slug: item.category?.slug || 'chua-phan-loai'
      },
      author: item.author || 'Bếp Nhà Ta',
      views: item.views || 0,
      likes: item.likes || 0,
      likedBy: item.likedBy || [],
      description: item.description || '',
      thumbnail: item.thumbnail || 'assets/images/ca-hoi.jpg',
      content: item.content || '',
      sections: item.sections || [],
      publishDate: item.publishDate || new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      saved: false
    }));
  }

  getBlogs(): Observable<BlogPost[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((response) => {
        console.log('Raw blog API response:', response);
        if (!Array.isArray(response)) {
          console.warn('Response không phải là mảng:', response);
          return [];
        }

        return this.mapResponseToBlogPosts(response);
      })
    );
  }

  getBlogsByCategory(categorySlug: string): Observable<BlogPost[]> {
    return this.getBlogs().pipe(
      map((blogs) =>
        blogs.filter((blog) => blog.category.slug === categorySlug)
      )
    );
  }

  getBlogById(id: string): Observable<BlogPost | undefined> {
    return this.getBlogs().pipe(
      map((blogs) => blogs.find((blog) => blog._id === id))
    );
  }

  getRelatedBlogs(currentBlogId: string, limit: number = 4): Observable<BlogPost[]> {
    return this.getBlogs().pipe(
      map((blogs) => 
        blogs
          .filter(blog => blog._id !== currentBlogId)
          .slice(0, limit)
      )
    );
  }
}
