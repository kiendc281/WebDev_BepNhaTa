import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { BlogPost } from '../models/blog.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs';

  constructor(private http: HttpClient) {}

  private mapResponseToBlogPosts(items: any[]): BlogPost[] {
    console.log('Mapping items:', items);
    
    return items.map(item => {
      console.log('Processing item:', item);
      
      // Xử lý sections nếu có
      let sections = [];
      if (item.sections && Array.isArray(item.sections)) {
        sections = item.sections.map((section: any) => {
          console.log('Processing section:', section);
          // Kiểm tra cấu trúc section
          return {
            _id: section._id || '',
            order: section.order || 0,
            content: {
              title: section.content?.title || '',
              text: section.content?.text || [],
              imageUrl: section.content?.imageUrl || '',
              imageCaption: section.content?.imageCaption || '',
              // Giữ lại các trường khác
              type: section.content?.type || '',
              url: section.content?.url || '',
              caption: section.content?.caption || ''
            }
          };
        });
      }

      // Xử lý author
      let author = null;
      if (item.author) {
        if (typeof item.author === 'object') {
          author = {
            _id: item.author._id || '',
            name: item.author.name || 'Bếp Nhà Ta',
            email: item.author.email || ''
          };
        } else if (typeof item.author === 'string') {
          author = {
            _id: '',
            name: item.author,
            email: ''
          };
        }
      }

      return {
        _id: item._id || '',
        title: item.title || '',
        slug: item.slug || '',
        category: {
          name: item.category?.name || 'Chưa phân loại',
          slug: item.category?.slug || 'chua-phan-loai'
        },
        author: author,
        views: item.views || 0,
        likes: item.likes || 0,
        likedBy: item.likedBy || [],
        description: item.description || '',
        thumbnail: item.thumbnail || 'assets/images/ca-hoi.jpg',
        content: item.content || '',
        sections: sections,
        publishDate: item.publishDate || new Date().toISOString(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        saved: false
      };
    });
  }

  getBlogs(): Observable<BlogPost[]> {
    const headers = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
      map((response) => {
        console.log('Raw blog API response:', response);
        if (!Array.isArray(response)) {
          console.warn('Response không phải là mảng:', response);
          return [];
        }

        return this.mapResponseToBlogPosts(response);
      }),
      catchError(error => {
        console.error('Error fetching blogs:', error);
        return of([]);
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
    const url = `${this.apiUrl}/${id}`;
    const headers = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
      map((response) => {
        console.log('Raw blog detail response:', response);
        if (!response) return undefined;
        
        return this.mapResponseToBlogPosts([response])[0];
      }),
      catchError(error => {
        console.error(`Error fetching blog with ID ${id}:`, error);
        return this.getBlogs().pipe(
          map(blogs => blogs.find(blog => blog._id === id))
        );
      })
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
