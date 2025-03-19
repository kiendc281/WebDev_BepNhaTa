import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { BlogPost } from '../models/blog.interface';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private apiUrl = 'http://localhost:3000/api/blogs';
  
  // Bộ chuyển đổi ID ngắn sang MongoDB ID
  private idMap = new Map<string, string>([
    ['BL01', '507f1f77bcf86cd799439011'],
    ['BL02', '507f1f77bcf86cd799439012'],
    ['BL03', '507f1f77bcf86cd799439013'],
    ['BL04', '507f1f77bcf86cd799439014'],
    ['BL05', '507f1f77bcf86cd799439015'],
  ]);

  constructor(private http: HttpClient) {}

  // Hàm chuyển đổi ID ngắn sang MongoDB ID
  private convertToMongoId(shortId: string): string {
    if (!shortId) return '';
    
    // Kiểm tra nếu đã là MongoDB ID (24 ký tự hex) thì trả về nguyên bản
    if (/^[0-9a-fA-F]{24}$/.test(shortId)) {
      return shortId;
    }
    
    // Nếu là ID ngắn (BL01, BL02, ...), chuyển đổi sang MongoDB ID
    const mongoId = this.idMap.get(shortId);
    if (mongoId) {
      console.log(`Đã chuyển đổi ID ngắn ${shortId} thành MongoDB ID ${mongoId}`);
      return mongoId;
    }
    
    // Nếu không tìm thấy trong bảng, tạo một ID giả dựa trên mã ngắn
    const randomId = '507f1f77bcf86cd7994390' + (Math.floor(Math.random() * 90) + 10);
    console.log(`ID ${shortId} không tìm thấy trong bảng, tạo ID ngẫu nhiên: ${randomId}`);
    this.idMap.set(shortId, randomId);
    return randomId;
  }

  // Ngược dịch từ MongoDB ID sang ID ngắn
  private reverseMapMongoId(mongoId: string): string {
    // Duyệt qua idMap để tìm key cho mongoId
    for (const [shortId, mappedMongoId] of this.idMap.entries()) {
      if (mappedMongoId === mongoId) {
        console.log(`Đã chuyển đổi MongoDB ID ${mongoId} thành ID ngắn ${shortId}`);
        return shortId;
      }
    }
    
    // Nếu không tìm thấy, trả về ID gốc
    return mongoId;
  }

  private mapResponseToBlogPosts(items: any[]): BlogPost[] {
    console.log('Mapping items:', items);
    
    return items.map(item => {
      console.log('Processing item:', item);
      
      // Chuyển đổi ID ngắn sang MongoDB ID
      const originalId = item._id;
      const mongoId = this.convertToMongoId(originalId);
      
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
        _id: mongoId, // Sử dụng MongoDB ID đã chuyển đổi
        originalId: originalId, // Lưu ID gốc để tham chiếu
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
    // Kiểm tra xem id có phải là MongoDB ID không
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Nếu là MongoDB ID, tìm ID ngắn tương ứng
    const apiId = isMongoId ? this.reverseMapMongoId(id) : id;
    
    console.log(`Đang gọi API lấy chi tiết blog với ID: ${apiId} (ID gốc: ${id})`);
    
    const url = `${this.apiUrl}/${apiId}`;
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
        console.error(`Error fetching blog with ID ${apiId}:`, error);
        return this.getBlogs().pipe(
          map(blogs => blogs.find(blog => blog._id === id || blog.originalId === id))
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
